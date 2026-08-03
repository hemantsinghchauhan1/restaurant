import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { deleteCache } from '@/lib/redis';

// POST: Create a brand new dish directly in Supabase PostgreSQL database
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or Manager access required to add dishes.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      categoryId,
      name,
      description,
      price,
      priceHalf,
      imageUrl,
      isVeg = true,
      inStock = true,
      prepTimeMinutes = 5,
    } = body;

    if (!categoryId || !name || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: categoryId, name, and price are required.' },
        { status: 400 }
      );
    }

    // Default food image if none provided
    const defaultImage = isVeg
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?auto=format&fit=crop&w=800&q=80';

    const newDish = await db.dish.create({
      data: {
        categoryId,
        name: name.trim(),
        description: description ? description.trim() : null,
        price: Number(price),
        priceHalf: priceHalf ? Number(priceHalf) : null,
        imageUrl: imageUrl ? imageUrl.trim() : defaultImage,
        isVeg: Boolean(isVeg),
        inStock: Boolean(inStock),
        prepTimeMinutes: Number(prepTimeMinutes) || 5,
      },
    });

    // Invalidate menu cache so users see new dish instantly
    deleteCache('public_menu_v1').catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Dish created successfully directly in Supabase database!',
      dish: newDish,
    });
  } catch (error) {
    console.error('Error creating dish in database:', error);
    return NextResponse.json(
      { error: 'Failed to create dish in database. Check categoryId and values.' },
      { status: 500 }
    );
  }
}
