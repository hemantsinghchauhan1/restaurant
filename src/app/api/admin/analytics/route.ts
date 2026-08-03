import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    // Fetch all completed/paid orders
    const orders = await db.order.findMany({
      include: {
        items: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const completedOrders = orders.filter(
      (o) => o.status === 'COMPLETED' || o.paymentStatus === 'PAID' || o.paymentStatus === 'CASH_VERIFIED'
    );

    // Calculate revenue metrics
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalOrdersCount = orders.length;

    // Payment method breakdown
    let onlinePaymentCount = 0;
    let cashPaymentCount = 0;
    completedOrders.forEach((o) => {
      if (o.paymentMethod === 'ONLINE') onlinePaymentCount++;
      else cashPaymentCount++;
    });

    // Order type breakdown
    let dineInCount = 0;
    let takeawayCount = 0;
    orders.forEach((o) => {
      if (o.orderType === 'DINE_IN') dineInCount++;
      else takeawayCount++;
    });

    // Calculate daily revenue trends (last 7 days)
    const dailyRevenueMap = new Map<string, number>();
    completedOrders.forEach((o) => {
      const dateKey = new Date(o.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const current = dailyRevenueMap.get(dateKey) || 0;
      dailyRevenueMap.set(dateKey, current + o.totalAmount);
    });

    const revenueTrends = Array.from(dailyRevenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    // Calculate top purchased items
    const dishSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const dishName = item.dish?.name || 'Unknown Dish';
        const existing = dishSalesMap.get(dishName) || { name: dishName, quantity: 0, revenue: 0 };
        dishSalesMap.set(dishName, {
          name: dishName,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.priceAtOrder * item.quantity,
        });
      });
    });

    const topDishes = Array.from(dishSalesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Visitor analytics & conversion rate
    const totalVisitLogs = await db.visitLog.count();
    const convertedVisits = await db.visitLog.count({
      where: { convertedToOrder: true },
    });

    const conversionRate = totalVisitLogs > 0 ? ((convertedVisits / totalVisitLogs) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrdersCount,
        completedOrdersCount: completedOrders.length,
        avgOrderValue: completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(0) : 0,
        conversionRate,
        totalMenuViews: totalVisitLogs,
      },
      paymentSplit: [
        { name: 'Online Payment', value: onlinePaymentCount },
        { name: 'Cash at Counter', value: cashPaymentCount },
      ],
      orderTypeSplit: [
        { name: 'Dine-In', value: dineInCount },
        { name: 'Takeaway', value: takeawayCount },
      ],
      revenueTrends,
      topDishes,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 });
  }
}
