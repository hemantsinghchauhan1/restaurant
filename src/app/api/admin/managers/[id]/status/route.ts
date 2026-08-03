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
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { status } = await request.json(); // 'APPROVED' | 'REJECTED' | 'SUSPENDED'
    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid manager status' }, { status: 400 });
    }

    const updatedManager = await db.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json({ success: true, manager: updatedManager });
  } catch (error) {
    console.error('Update manager status error:', error);
    return NextResponse.json({ error: 'Failed to update manager status' }, { status: 500 });
  }
}
