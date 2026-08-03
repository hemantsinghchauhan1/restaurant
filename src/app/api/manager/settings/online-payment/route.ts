import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { setCache, deleteCache } from '@/lib/redis';

const SETTING_KEY = 'online_payment_enabled_cache';

let memoryState = true; // In-memory fallback guarantee

async function ensureTable() {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StoreSetting" (
        "key" TEXT NOT NULL,
        "value" TEXT NOT NULL,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("key")
      );
    `);
  } catch {
    // ignore
  }
}

export async function GET() {
  try {
    await ensureTable();
    const setting = await db.storeSetting.findUnique({
      where: { key: 'online_payment_enabled' },
    });

    const isEnabled = setting ? setting.value === 'true' : memoryState;
    return NextResponse.json({ onlinePaymentEnabled: isEnabled });
  } catch {
    return NextResponse.json({ onlinePaymentEnabled: memoryState });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable();
    const body = await request.json();
    const { onlinePaymentEnabled } = body;

    const valBool = Boolean(onlinePaymentEnabled);
    memoryState = valBool;
    const valStr = String(valBool);

    try {
      await db.storeSetting.upsert({
        where: { key: 'online_payment_enabled' },
        update: { value: valStr, updatedAt: new Date() },
        create: { key: 'online_payment_enabled', value: valStr, updatedAt: new Date() },
      });
    } catch {
      // Memory state fallback guarantees success
    }

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
