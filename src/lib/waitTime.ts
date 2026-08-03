import { db } from './db';

/**
 * Dynamic Wait Time Calculation:
 * - Base dish preparation complexity (max dish prep time)
 * - Order Total Amount scaling (e.g. ₹1000+ orders require 8-12 min additional prep)
 * - Live Kitchen Queue Delay (+3 mins for every active order ahead in queue)
 */
export async function calculateEstimatedWaitTime(dishIds: string[], totalAmount: number = 0): Promise<number> {
  try {
    const selectedDishes = await db.dish.findMany({
      where: { id: { in: dishIds } },
      select: { prepTimeMinutes: true },
    });

    const maxItemPrepTime = selectedDishes.reduce(
      (max, item) => Math.max(max, item.prepTimeMinutes || 7),
      7
    );

    // Amount-based scaling: larger orders require more prep time
    let amountPrepBonus = 2;
    if (totalAmount >= 1000) {
      amountPrepBonus = 12; // 1000+ INR orders take 10-15+ mins base
    } else if (totalAmount >= 600) {
      amountPrepBonus = 8;
    } else if (totalAmount >= 250) {
      amountPrepBonus = 5;
    }

    // Live Queue Ahead Count
    const activeOrdersAhead = await db.order.count({
      where: {
        status: { in: ['AWAITING_CASH_VERIFICATION', 'CONFIRMED', 'PREPARING'] },
      },
    });

    const queueDelay = activeOrdersAhead * 3; // 3 mins per order ahead
    return Math.max(5, maxItemPrepTime + amountPrepBonus + queueDelay);
  } catch {
    return 15;
  }
}

/**
 * Generates unique, short, human-readable order number encoding Month + Date + Sequence
 * Example: #0801-014 (Month 08, Date 01, Order #014)
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');

  let seq = (await db.order.count({ where: { orderNumber: { not: null } } })) + 1;
  let candidate = `#${month}${date}-${String(seq).padStart(3, '0')}`;

  let existing = await db.order.findFirst({ where: { orderNumber: candidate } });
  while (existing) {
    seq += 1;
    candidate = `#${month}${date}-${String(seq).padStart(3, '0')}`;
    existing = await db.order.findFirst({ where: { orderNumber: candidate } });
  }

  return candidate;
}

/**
 * Generates guaranteed unique short temporary reference for cash orders
 * Example: CASH-0801-014
 */
export async function generateTempRef(): Promise<string> {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');

  let seq = (await db.order.count({ where: { tempRef: { not: null } } })) + 1;
  let candidate = `CASH-${month}${date}-${String(seq).padStart(3, '0')}`;

  let existing = await db.order.findUnique({ where: { tempRef: candidate } });
  while (existing) {
    seq += 1;
    candidate = `CASH-${month}${date}-${String(seq).padStart(3, '0')}`;
    existing = await db.order.findUnique({ where: { tempRef: candidate } });
  }

  return candidate;
}
