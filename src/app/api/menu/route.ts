import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Async record visit log without blocking response
      db.visitLog
        .create({
          data: { sessionId, page: '/menu' },
        })
        .catch(() => {});
    }

    const categories = await db.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        dishes: {
          orderBy: { name: 'asc' },
        },
      },
    });

    const activeQueueCount = await db.order.count({
      where: {
        status: { in: ['AWAITING_CASH_VERIFICATION', 'CONFIRMED', 'PREPARING'] },
      },
    });

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

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name, description, price, imageUrl, isVeg, inStock, prepTimeMinutes } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json({ error: 'Category, name and price are required' }, { status: 400 });
    }

    const dish = await db.dish.create({
      data: {
        categoryId,
        name,
        description: description || '',
        price: Number(price),
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        isVeg: Boolean(isVeg),
        inStock: inStock !== undefined ? Boolean(inStock) : true,
        prepTimeMinutes: prepTimeMinutes ? Number(prepTimeMinutes) : 12,
      },
    });

    return NextResponse.json({ success: true, dish });
  } catch (error) {
    console.error('Dish create error:', error);
    return NextResponse.json({ error: 'Failed to create dish' }, { status: 500 });
  }
}
