/**
 * Order Search & Filter Utility
 * Handles Order Number, Temp Cash Ref, Table Number, Customer Name/Phone with direct indexed queries
 */

export interface OrderFilterOptions {
  query?: string;
  status?: string;
  orderType?: string;
  paymentMethod?: string;
  dateRange?: 'TODAY' | 'WEEK' | 'ALL';
  tableNumber?: string;
  urgencySort?: boolean;
}

export function filterOrders(orders: any[], options: OrderFilterOptions) {
  const {
    query = '',
    status = '',
    orderType = '',
    paymentMethod = '',
    dateRange = 'ALL',
    tableNumber = '',
    urgencySort = false,
  } = options;

  const cleanQuery = query.trim().toLowerCase().replace(/^#/, '');

  let filtered = orders.filter((ord) => {
    // 1. Status Filter
    if (status && ord.status !== status) {
      return false;
    }

    // 2. Order Type Filter
    if (orderType && ord.orderType !== orderType) {
      return false;
    }

    // 3. Payment Method Filter
    if (paymentMethod && ord.paymentMethod !== paymentMethod) {
      return false;
    }

    // 4. Table Number Filter
    if (tableNumber && ord.tableNumber !== tableNumber) {
      return false;
    }

    // 5. Date Range Filter
    if (dateRange !== 'ALL') {
      const orderDate = new Date(ord.createdAt);
      const now = new Date();

      if (dateRange === 'TODAY') {
        const isToday =
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateRange === 'WEEK') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < oneWeekAgo) return false;
      }
    }

    // 6. Search Query Auto-Detection (Order Number, Temp Ref, Table, Customer Name/Phone)
    if (cleanQuery) {
      const ordNum = (ord.orderNumber || '').toLowerCase().replace(/^#/, '');
      const tempRef = (ord.tempRef || '').toLowerCase();
      const tblNum = (ord.tableNumber || '').toLowerCase();
      const custName = (ord.customerName || '').toLowerCase();
      const custPhone = (ord.customerPhone || '').toLowerCase();
      const id = (ord.id || '').toLowerCase();

      // Check for match across fields
      const isMatch =
        ordNum.includes(cleanQuery) ||
        tempRef.includes(cleanQuery) ||
        tblNum === cleanQuery ||
        custName.includes(cleanQuery) ||
        custPhone.includes(cleanQuery) ||
        id.includes(cleanQuery);

      if (!isMatch) return false;
    }

    return true;
  });

  // Urgency Sort vs Most Recent Sort
  if (urgencySort) {
    const statusPriority: Record<string, number> = {
      AWAITING_CASH_VERIFICATION: 1,
      PLACED: 2,
      CONFIRMED: 3,
      PREPARING: 4,
      READY: 5,
      COMPLETED: 6,
      CANCELLED: 7,
    };

    return filtered.sort((a, b) => {
      const prioA = statusPriority[a.status] || 99;
      const prioB = statusPriority[b.status] || 99;
      if (prioA !== prioB) return prioA - prioB;
      // First In, First Out (Earliest order timestamp first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  // Default: Earliest First (First In, First Out)
  return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
