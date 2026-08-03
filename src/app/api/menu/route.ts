import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const rawCategories = await db.category.findMany({
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
    });

    const activeQueueCount = await db.order.count({
      where: {
        status: { in: ['AWAITING_CASH_VERIFICATION', 'CONFIRMED', 'PREPARING'] },
      },
    });

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

    return NextResponse.json(
      { categories, activeQueueCount },
      {
        headers: {
          'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
        },
      }
    );
  } catch (error) {
    console.error('Menu fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}
