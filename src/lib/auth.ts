import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { db } from './db';

// Simple SHA-256 password hashing helper for zero extra native deps
export function hashPassword(password: string): string {
  const salt = 'restaurant_app_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

export function generateToken(user: { id: string; role: string }): string {
  const payload = JSON.stringify({
    id: user.id,
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'secret')
    .update(encoded)
    .digest('hex');
  return `${encoded}.${signature}`;
}

export function verifyToken(token: string): { id: string; role: string } | null {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'secret')
      .update(encoded)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      if (payload.exp < Date.now()) return null;
      return { id: payload.id, role: payload.role };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('restaurant_session')?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== 'APPROVED') return null;
  return user;
}
