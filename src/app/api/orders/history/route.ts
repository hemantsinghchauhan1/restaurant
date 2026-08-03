import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view your order history.' },
        { status: 401 }
      );
    }

    const orders = await db.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          ...(user.phone ? [{ customerPhone: user.phone }] : []),
          { customerName: user.name },
        ],
      },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders, user });
  } catch (error) {
    console.error('Order history fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch order history' }, { status: 500 });
  }
}
