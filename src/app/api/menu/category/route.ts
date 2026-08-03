import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const { name, icon, sortOrder } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await db.category.create({
      data: {
        name,
        icon: icon || 'Utensils',
        sortOrder: sortOrder ? Number(sortOrder) : 0,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Category create error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
