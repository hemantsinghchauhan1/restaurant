import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, hashPassword } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dishId = searchParams.get('dishId');

    let whereClause: Record<string, unknown> = {};
    if (dishId) {
      whereClause = { dishId };
    }

    const reviews = await db.review.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true },
        },
        dish: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dishId, rating, comment, userEmail, userName } = body;

    let user = await getSessionUser();

    // If Clerk client user exists, sync user to Supabase DB if not already present
    if (!user && userEmail) {
      user = await db.user.findUnique({
        where: { email: userEmail },
        select: { id: true, name: true, email: true, phone: true, role: true, status: true },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            name: userName || 'Customer',
            email: userEmail,
            passwordHash: hashPassword('clerk_oauth_user'),
            role: 'CUSTOMER',
            status: 'APPROVED',
          },
          select: { id: true, name: true, email: true, phone: true, role: true, status: true },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to rate and review dishes.' },
        { status: 401 }
      );
    }

    if (!dishId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid dish ID and rating (1-5 stars) are required.' },
        { status: 400 }
      );
    }

    const review = await db.review.create({
      data: {
        dishId,
        userId: user.id,
        rating: Number(rating),
        comment: comment ? String(comment).trim() : null,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review submit error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
