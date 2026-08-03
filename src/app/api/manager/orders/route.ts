import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'active' | 'cash_pending' | 'history'

    let whereClause: Record<string, unknown> = {};

    if (filter === 'cash_pending') {
      whereClause = { status: 'AWAITING_CASH_VERIFICATION' };
    } else if (filter === 'active') {
      whereClause = {
        status: { in: ['AWAITING_CASH_VERIFICATION', 'CONFIRMED', 'PREPARING', 'READY'] },
      };
    } else if (filter === 'history') {
      whereClause = {
        status: { in: ['COMPLETED', 'CANCELLED'] },
      };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
        payments: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Manager orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch manager orders' }, { status: 500 });
  }
}
