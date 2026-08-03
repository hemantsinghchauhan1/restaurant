import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or Manager permission required.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await uploadToCloudinary(buffer, 'restaurant_dishes');

    return NextResponse.json({
      success: true,
      url: imageUrl,
    });
  } catch (error) {
    console.error('Image upload endpoint error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
