import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'CHEF' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Kitchen staff access required.' }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PREPARING', 'READY'] },
      },
      select: {
        id: true,
        orderNumber: true,
        tempRef: true,
        orderType: true,
        tableNumber: true,
        status: true,
        estimatedWaitMinutes: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            portion: true,
            notes: true,
            dish: {
              select: {
                name: true,
                isVeg: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Oldest active orders first
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Kitchen orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch kitchen orders' }, { status: 500 });
  }
}
