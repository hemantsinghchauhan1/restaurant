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
    if (!user || (user.role !== 'CHEF' && user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Kitchen access required.' }, { status: 401 });
    }

    const { status } = await request.json();
    const validStatuses = ['PREPARING', 'READY', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
    }

    const updatedOrder = await db.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Kitchen status update error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
