import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setCache, deleteCache } from '@/lib/redis';

const SETTING_KEY = 'online_payment_enabled_cache';

export async function GET() {
  try {
    const setting = await db.storeSetting.findUnique({
      where: { key: 'online_payment_enabled' },
    });

    const isEnabled = setting ? setting.value === 'true' : true; // Default true
    return NextResponse.json({ onlinePaymentEnabled: isEnabled });
  } catch {
    return NextResponse.json({ onlinePaymentEnabled: true });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { onlinePaymentEnabled } = body;

    const valBool = Boolean(onlinePaymentEnabled);
    const valStr = String(valBool);

    await db.storeSetting.upsert({
      where: { key: 'online_payment_enabled' },
      update: { value: valStr },
      create: { key: 'online_payment_enabled', value: valStr },
    });

    const result = { onlinePaymentEnabled: valBool };
    await setCache(SETTING_KEY, result, 3600).catch(() => {});
    await deleteCache('public_menu_v1').catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Online payment ${valBool ? 'ENABLED' : 'DISABLED (Cash Only Mode)'}`,
      onlinePaymentEnabled: valBool,
    });
  } catch (error) {
    console.error('Error updating online payment setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
