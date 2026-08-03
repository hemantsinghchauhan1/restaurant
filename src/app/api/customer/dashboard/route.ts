import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to view your dashboard.' },
        { status: 401 }
      );
    }

    // Fetch customer's orders directly from Supabase DB
    const orders = await db.order.findMany({
      where: {
        OR: [
          { userId: user.id },
          { customerName: user.name },
          ...(user.phone ? [{ customerPhone: user.phone }] : []),
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

    // Fetch customer's reviews directly from Supabase DB
    const reviews = await db.review.findMany({
      where: { userId: user.id },
      include: {
        dish: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all available dishes for rating dropdown
    const dishes = await db.dish.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        price: true,
        isVeg: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      user,
      orders,
      reviews,
      dishes,
    });
  } catch (error) {
    console.error('Customer dashboard API error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer dashboard data' }, { status: 500 });
  }
}
