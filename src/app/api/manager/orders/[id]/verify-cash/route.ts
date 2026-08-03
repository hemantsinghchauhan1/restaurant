import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/waitTime';

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

    // Find order by ID or tempRef
    const existingOrder = await db.order.findFirst({
      where: {
        OR: [{ id }, { tempRef: id }],
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.paymentStatus === 'CASH_VERIFIED' || existingOrder.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Order payment has already been verified' }, { status: 400 });
    }

    // Generate real order number
    const orderNumber = await generateOrderNumber();

    // Update order state
    const updatedOrder = await db.order.update({
      where: { id: existingOrder.id },
      data: {
        orderNumber,
        status: 'CONFIRMED',
        paymentStatus: 'CASH_VERIFIED',
        verifiedBy: user.id,
        confirmedAt: new Date(),
      },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
    });

    // Create payment record for cash verification
    await db.payment.create({
      data: {
        orderId: updatedOrder.id,
        gateway: 'CASH',
        gatewayTxnId: `CASH_VERIFIED_${user.id.slice(0, 4)}_${Date.now()}`,
        amount: updatedOrder.totalAmount,
        status: 'SUCCESS',
        verifiedBy: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Cash payment verified! Permanent order ${orderNumber} created.`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Cash verification error:', error);
    return NextResponse.json({ error: 'Failed to verify cash payment' }, { status: 500 });
  }
}
