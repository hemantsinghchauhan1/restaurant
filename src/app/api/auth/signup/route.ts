import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateToken, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, role = 'CUSTOMER' } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const userRole = role === 'MANAGER' ? 'MANAGER' : 'CUSTOMER';
    const initialStatus = userRole === 'CUSTOMER' ? 'APPROVED' : 'PENDING';

    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        phone,
        passwordHash: hashPassword(password),
        role: userRole,
        status: initialStatus,
      },
    });

    const response = NextResponse.json({
      success: true,
      message:
        userRole === 'CUSTOMER'
          ? 'Account created successfully!'
          : 'Signup request submitted! Your manager account is pending Admin approval.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    if (userRole === 'CUSTOMER') {
      const token = generateToken({ id: user.id, role: user.role });
      response.cookies.set('restaurant_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
