import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'CHEF')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const totalOrdersCount = orders.length;

    // Filter non-cancelled orders for revenue calculation
    const validOrders = orders.filter((o) => o.status !== 'CANCELLED');

    const totalRevenue = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Payment method counts
    let onlinePayments = 0;
    let cashPayments = 0;
    orders.forEach((o) => {
      if (o.paymentMethod === 'ONLINE') onlinePayments++;
      else cashPayments++;
    });

    // Calculate hourly timeline revenue for today
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const hourlyRevenue = [0, 0, 0, 0, 0]; // 12AM, 6AM, 12PM, 6PM, 12AM
    validOrders.forEach((o) => {
      const orderDate = new Date(o.createdAt);
      if (orderDate >= startOfDay) {
        const hour = orderDate.getHours();
        if (hour < 6) hourlyRevenue[0] += o.totalAmount;
        else if (hour < 12) hourlyRevenue[1] += o.totalAmount;
        else if (hour < 18) hourlyRevenue[2] += o.totalAmount;
        else if (hour < 22) hourlyRevenue[3] += o.totalAmount;
        else hourlyRevenue[4] += o.totalAmount;
      }
    });

    // Calculate top selling dishes from real order items
    const dishMap = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();
    validOrders.forEach((order) => {
      order.items.forEach((item) => {
        const dishId = item.dishId;
        const name = item.dish?.name || 'Unknown Item';
        const existing = dishMap.get(dishId) || { id: dishId, name, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += item.priceAtOrder * item.quantity;
        dishMap.set(dishId, existing);
      });
    });

    const topSellingItems = Array.from(dishMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      totalOrdersCount,
      totalRevenue,
      onlinePayments,
      cashPayments,
      onlinePercentage: totalOrdersCount > 0 ? Math.round((onlinePayments / totalOrdersCount) * 100) : 0,
      cashPercentage: totalOrdersCount > 0 ? Math.round((cashPayments / totalOrdersCount) * 100) : 0,
      hourlyRevenue,
      topSellingItems,
    });
  } catch (error) {
    console.error('Error fetching manager analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
