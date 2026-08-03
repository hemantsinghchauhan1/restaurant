import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateEstimatedWaitTime, generateOrderNumber, generateTempRef } from '@/lib/waitTime';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const loggedInUser = await getSessionUser();
    const body = await request.json();
    const {
      items,
      orderType = 'DINE_IN',
      tableNumber,
      paymentMethod = 'ONLINE',
      customerName,
      customerPhone,
      sessionId,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart cannot be empty' }, { status: 400 });
    }

    // Fetch dishes and check availability
    const dishIds = items.map((i: { dishId: string }) => i.dishId);
    const dbDishes = await db.dish.findMany({
      where: { id: { in: dishIds } },
    });

    const dishMap = new Map(dbDishes.map((d) => [d.id, d]));

    // Check for out of stock items
    const outOfStockNames: string[] = [];
    let totalAmount = 0;

    const orderItemsData = items.map((item: { dishId: string; quantity: number; portion?: string; notes?: string }) => {
      const dish = dishMap.get(item.dishId);
      if (!dish) {
        throw new Error(`Dish not found: ${item.dishId}`);
      }
      if (!dish.inStock) {
        outOfStockNames.push(dish.name);
      }

      const portion = item.portion || 'FULL';
      const unitPrice = portion === 'HALF' && dish.priceHalf ? dish.priceHalf : dish.price;
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      return {
        dishId: dish.id,
        quantity: item.quantity,
        priceAtOrder: unitPrice,
        portion,
        notes: item.notes || null,
      };
    });

    if (outOfStockNames.length > 0) {
      return NextResponse.json(
        {
          error: `The following items are currently out of stock: ${outOfStockNames.join(', ')}. Please update your cart.`,
          outOfStockDishes: outOfStockNames,
        },
        { status: 400 }
      );
    }

    // Compute dynamic wait time based on cart dishes, total amount, and active queue length
    const estimatedWaitMinutes = await calculateEstimatedWaitTime(dishIds, totalAmount);

    const isOnline = paymentMethod === 'ONLINE';
    let orderNumber: string | null = null;
    let tempRef: string | null = null;

    if (isOnline) {
      orderNumber = await generateOrderNumber();
    } else {
      tempRef = await generateTempRef();
    }

    // Create Order in DB
    const order = await db.order.create({
      data: {
        tempRef,
        orderNumber,
        orderType,
        tableNumber: tableNumber || null,
        status: isOnline ? 'CONFIRMED' : 'AWAITING_CASH_VERIFICATION',
        paymentMethod,
        paymentStatus: isOnline ? 'PAID' : 'CASH_PENDING',
        estimatedWaitMinutes,
        customerName: customerName || (loggedInUser ? loggedInUser.name : null),
        customerPhone: customerPhone || (loggedInUser ? loggedInUser.phone : null),
        userId: loggedInUser ? loggedInUser.id : null,
        totalAmount,
        confirmedAt: isOnline ? new Date() : null,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
    });

    // Create Payment entry for online orders
    if (isOnline) {
      await db.payment.create({
        data: {
          orderId: order.id,
          gateway: 'RAZORPAY',
          gatewayTxnId: `pay_sim_${order.id.slice(0, 8)}`,
          amount: totalAmount,
          status: 'SUCCESS',
        },
      });
    }

    // Mark visit conversion if session ID exists
    if (sessionId) {
      db.visitLog
        .updateMany({
          where: { sessionId },
          data: { convertedToOrder: true },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        tempRef: order.tempRef,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        estimatedWaitMinutes: order.estimatedWaitMinutes,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items,
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
    console.error('Order creation error:', error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
