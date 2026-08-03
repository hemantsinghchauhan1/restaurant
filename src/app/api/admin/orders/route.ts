import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const orderType = searchParams.get('orderType');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (orderType) where.orderType = orderType;

    const orders = await db.order.findMany({
      where,
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
    console.error('Fetch all orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch order history' }, { status: 500 });
  }
}
