import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Manager login required.' }, { status: 401 });
    }

    const { status } = await request.json();
    const validStatuses = ['PLACED', 'AWAITING_CASH_VERIFICATION', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const order = await db.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
