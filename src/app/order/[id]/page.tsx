'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, ArrowLeft, ChefHat, Utensils, Banknote, Sparkles, LayoutDashboard, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface OrderItemData {
  id: string;
  dish: {
    name: string;
    imageUrl: string;
    isVeg: boolean;
  };
  quantity: number;
  priceAtOrder: number;
  notes?: string;
}

interface OrderData {
  id: string;
  tempRef: string | null;
  orderNumber: string | null;
  orderType: string;
  tableNumber: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedWaitMinutes: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItemData[];
}

import confetti from 'canvas-confetti';
import { SkeletonOrderTicket } from '@/components/ui/Skeleton';

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { clearCart } = useCart();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Clear cart on mount
  useEffect(() => {
    clearCart();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899'],
      });
    } catch {
      // ignore
    }
  }, []);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch {
      setError('Failed to fetch order status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Poll status every 3 seconds for live tracking updates
    const interval = setInterval(() => {
      fetchOrder();
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-lg mx-auto pb-16 space-y-6">
        <SkeletonOrderTicket />
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col items-center justify-center space-y-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-50">Order Not Found</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              This order ID might be from a previous session or has expired. You can view all your live and past orders directly in your Customer Dashboard!
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href="/customer/dashboard"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Go to My Customer Dashboard</span>
            </Link>

            <Link
              href="/menu"
              className="w-full bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Browse Menu & Order</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isCashPending = order.paymentStatus === 'CASH_PENDING';

  // Status timeline steps
  const statusSteps = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
    { key: 'READY', label: 'Ready', icon: Utensils },
    { key: 'COMPLETED', label: 'Served', icon: Sparkles },
  ];

  const getStatusIndex = (st: string) => {
    switch (st) {
      case 'CONFIRMED':
        return 0;
      case 'PREPARING':
        return 1;
      case 'READY':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return -1;
    }
  };

  const currentStepIdx = getStatusIndex(order.status);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-lg mx-auto pb-16 space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <Link
          href="/menu"
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Order More</span>
        </Link>
        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
          LIVE TRACKER
        </span>
      </div>

      {/* Main Order Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
        {/* Cash Verification Warning Banner */}
        {isCashPending ? (
          <div className="bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/50 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <Banknote className="w-5 h-5" />
              <span>AWAITING CASH PAYMENT AT COUNTER</span>
            </div>
            <div className="text-center py-3 bg-slate-950 rounded-xl border border-amber-500/30">
              <div className="text-xs text-slate-400">Quote Temporary Reference</div>
              <div className="text-3xl font-black text-amber-400 tracking-wider font-mono mt-1">
                {order.tempRef}
              </div>
            </div>
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Please walk up to the counter and pay <strong className="text-amber-400">₹{order.totalAmount}</strong>.
              This page will automatically update once the manager verifies your cash!
            </p>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-bold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ORDER CONFIRMED</span>
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-widest">Order Number</div>
            <div className="text-4xl font-black text-slate-50 tracking-tight">{order.orderNumber}</div>
            {order.tableNumber && (
              <div className="text-xs font-semibold text-slate-400 mt-1">
                Dine-In • Table #{order.tableNumber}
              </div>
            )}
          </div>
        )}

        {/* Estimated Wait Time Banner */}
        {!isCashPending && order.status !== 'COMPLETED' && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>ESTIMATED WAIT TIME</span>
            </div>
            <div className="text-3xl font-black text-slate-100">~{order.estimatedWaitMinutes} Mins</div>
            <p className="text-[11px] text-slate-400">Calculated live based on active kitchen load</p>
          </div>
        )}

        {/* Status Timeline */}
        {!isCashPending && (
          <div className="space-y-4 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
              Live Preparation Timeline
            </span>
            <div className="relative">
              {/* Background & Glowing Progress Line */}
              <div className="absolute top-5 left-[12%] right-[12%] h-1 bg-slate-950 rounded-full z-0 overflow-hidden">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{
                    width: `${Math.min(100, Math.max(15, (currentStepIdx / (statusSteps.length - 1)) * 100))}%`,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 relative z-10">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isPassed = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center gap-1.5 text-center">
                      <motion.div
                        animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                        transition={isCurrent ? { repeat: Infinity, duration: 1.8 } : {}}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/40 ring-4 ring-amber-500/20'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                            : 'bg-slate-950 text-slate-600 border border-slate-800'
                        }`}
                      >
                        <Icon className="w-5 h-5 stroke-[2.5]" />
                      </motion.div>
                      <span
                        className={`text-[10px] font-bold ${
                          isCurrent ? 'text-amber-400 font-black' : isPassed ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Order Items Summary */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Items Ordered
          </span>
          <div className="space-y-2.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-800 font-bold text-amber-400 flex items-center justify-center text-xs">
                    {item.quantity}x
                  </span>
                  <span className="text-slate-200 font-medium">{item.dish.name}</span>
                </div>
                <span className="font-bold text-slate-300">₹{item.priceAtOrder * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 font-bold text-sm">
            <span className="text-slate-400">Total Paid</span>
            <span className="text-amber-400 text-lg">₹{order.totalAmount}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
