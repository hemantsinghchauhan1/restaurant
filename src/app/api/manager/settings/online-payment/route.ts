import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { getCache, setCache } from '@/lib/redis';

const SETTING_KEY = 'online_payment_enabled_cache';

export async function GET() {
  try {
    const cached = await getCache<{ onlinePaymentEnabled: boolean }>(SETTING_KEY);
    if (cached) {
      return NextResponse.json(cached);
    }

    const setting = await db.storeSetting.findUnique({
      where: { key: 'online_payment_enabled' },
    });

    const isEnabled = setting ? setting.value === 'true' : true; // Default true
    const result = { onlinePaymentEnabled: isEnabled };

    setCache(SETTING_KEY, result, 60).catch(() => {});
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ onlinePaymentEnabled: true });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Manager or Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { onlinePaymentEnabled } = body;

    const valStr = String(Boolean(onlinePaymentEnabled));

    await db.storeSetting.upsert({
      where: { key: 'online_payment_enabled' },
      update: { value: valStr },
      create: { key: 'online_payment_enabled', value: valStr },
    });

    const result = { onlinePaymentEnabled: Boolean(onlinePaymentEnabled) };
    await setCache(SETTING_KEY, result, 60);

    return NextResponse.json({
      success: true,
      message: `Online payment ${onlinePaymentEnabled ? 'ENABLED' : 'DISABLED (Cash Only Mode)'}`,
      onlinePaymentEnabled: Boolean(onlinePaymentEnabled),
    });
  } catch (error) {
    console.error('Error updating online payment setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
