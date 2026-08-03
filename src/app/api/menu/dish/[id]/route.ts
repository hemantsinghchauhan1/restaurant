import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { deleteCache } from '@/lib/redis';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inStock } = body;

    const dish = await db.dish.update({
      where: { id },
      data: { inStock: Boolean(inStock) },
    });

    deleteCache('public_menu_v1').catch(() => {});

    return NextResponse.json({ success: true, dish });
  } catch (error) {
    console.error('Dish stock update error:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { categoryId, name, description, price, imageUrl, isVeg, inStock, prepTimeMinutes } = body;

    const dish = await db.dish.update({
      where: { id },
      data: {
        ...(categoryId && { categoryId }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(imageUrl && { imageUrl }),
        ...(isVeg !== undefined && { isVeg: Boolean(isVeg) }),
        ...(inStock !== undefined && { inStock: Boolean(inStock) }),
        ...(prepTimeMinutes !== undefined && { prepTimeMinutes: Number(prepTimeMinutes) }),
      },
    });

    return NextResponse.json({ success: true, dish });
  } catch (error) {
    console.error('Dish update error:', error);
    return NextResponse.json({ error: 'Failed to update dish' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    await db.dish.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dish delete error:', error);
    return NextResponse.json({ error: 'Failed to delete dish' }, { status: 500 });
  }
}
