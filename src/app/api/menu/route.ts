import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCache, setCache } from '@/lib/redis';

const MENU_CACHE_KEY = 'public_menu_v1';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      db.visitLog
        .create({
          data: { sessionId, page: '/menu' },
        })
        .catch(() => {});
    }

    // Attempt to serve from Redis / Memory Cache
    const cachedMenu = await getCache<any>(MENU_CACHE_KEY);
    if (cachedMenu) {
      return NextResponse.json(cachedMenu, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }

    const [rawCategories, activeQueueCount] = await Promise.all([
      db.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          dishes: {
            orderBy: { name: 'asc' },
            include: {
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      }),
      db.order.count({
        where: {
          status: { in: ['AWAITING_CASH_VERIFICATION', 'CONFIRMED', 'PREPARING'] },
        },
      }),
    ]);

    // Compute REAL average rating & review count for every dish with 0 mock data
    const categories = rawCategories.map((cat) => ({
      ...cat,
      dishes: cat.dishes.map((d) => {
        const count = d.reviews.length;
        const totalRating = d.reviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = count > 0 ? Number((totalRating / count).toFixed(1)) : 0;

        const { reviews, ...dishData } = d;
        return {
          ...dishData,
          avgRating: avg,
          reviewCount: count,
        };
      }),
    }));

    const menuPayload = { categories, activeQueueCount };
    setCache(MENU_CACHE_KEY, menuPayload, 60).catch(() => {});

    return NextResponse.json(menuPayload, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
