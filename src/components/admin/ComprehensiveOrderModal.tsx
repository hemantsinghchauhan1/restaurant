'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  CheckCircle2,
  ChefHat,
  Utensils,
  Sparkles,
  User,
  Phone,
  Banknote,
  ExternalLink,
  Calendar,
  Timer,
  ShoppingBag,
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  priceAtOrder: number;
  portion?: string | null;
  dish: {
    id: string;
    name: string;
    imageUrl: string;
    isVeg: boolean;
  };
}

interface ComprehensiveOrder {
  id: string;
  orderNumber?: string | null;
  tempRef?: string | null;
  orderType: string;
  tableNumber?: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedWaitMinutes: number;
  totalAmount: number;
  createdAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  items: OrderItem[];
}

interface ComprehensiveOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ComprehensiveOrder | null;
  onStatusChange?: (orderId: string, newStatus: string) => void;
}

export function ComprehensiveOrderModal({
  isOpen,
  onClose,
  order,
  onStatusChange,
}: ComprehensiveOrderModalProps) {
  if (!isOpen || !order) return null;

  const orderDate = new Date(order.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Calculate time elapsed
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - orderDate.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));

  const statusSteps = [
    { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
    { key: 'READY', label: 'Ready', icon: Utensils },
    { key: 'COMPLETED', label: 'Served / Done', icon: Sparkles },
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
        return 0;
    }
  };

  const currentStepIdx = getStatusIndex(order.status);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative space-y-6 my-auto text-slate-100 max-h-[90vh] overflow-y-auto"
        >
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 bg-slate-950 rounded-full border border-slate-800 transition-colors z-10 shadow-md"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Modal Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {order.orderNumber || order.tempRef || order.id.slice(0, 8)}
                </span>
                <span className="text-[10px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-0.5 rounded-full uppercase">
                  {order.orderType}
                </span>
                {order.tableNumber && (
                  <span className="text-[10px] font-black bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-0.5 rounded-full">
                    Table #{order.tableNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Placed on {formattedDate} at {formattedTime}
                </span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
                Total Amount
              </span>
              <span className="text-2xl font-black text-emerald-400">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Time Analytics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                <Timer className="w-4 h-4 text-amber-400" />
                <span>Estimated Wait</span>
              </div>
              <p className="text-lg font-black text-slate-100">~{order.estimatedWaitMinutes} Mins</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Elapsed Duration</span>
              </div>
              <p className="text-lg font-black text-slate-100">
                {order.status === 'COMPLETED'
                  ? 'Completed'
                  : `${elapsedMinutes} Mins Ago`}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Payment</span>
              </div>
              <p className="text-sm font-bold text-slate-200">
                {order.paymentMethod} •{' '}
                <span
                  className={
                    order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS'
                      ? 'text-emerald-400 font-black'
                      : 'text-amber-400 font-black'
                  }
                >
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          {/* Customer Profile Banner */}
          {(order.customerName || order.customerPhone) && (
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-200 block">
                    {order.customerName || 'Walk-in Customer'}
                  </span>
                  {order.customerPhone && (
                    <span className="text-slate-400 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {order.customerPhone}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/order/${order.id}`}
                target="_blank"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-[11px] font-bold text-amber-400 flex items-center gap-1 transition-all"
              >
                <span>Live Tracker</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-3 pt-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Live Order Pipeline
            </span>
            <div className="grid grid-cols-4 gap-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {statusSteps.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIdx >= idx;
                const isCurrent = currentStepIdx === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center gap-1.5 text-center">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-500/30'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-600 border border-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <span
                      className={`text-[10px] font-bold ${
                        isCurrent ? 'text-amber-400' : isPassed ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Itemized Order Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Itemized Dishes ({order.items?.length || 0})</span>
              </span>
              <span className="text-xs text-slate-500 font-semibold">Portion & Subtotal</span>
            </div>

            <div className="space-y-2 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 max-h-56 overflow-y-auto">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    {item.dish?.imageUrl && (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                        <Image
                          src={item.dish.imageUrl}
                          alt={item.dish.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-amber-400 font-mono">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-slate-100">{item.dish?.name || 'Dish Item'}</span>
                        {item.dish?.isVeg !== undefined && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              item.dish.isVeg
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {item.dish.isVeg ? 'VEG' : 'NON-VEG'}
                          </span>
                        )}
                      </div>
                      {item.portion && (
                        <span className="text-[11px] text-slate-400">Portion: {item.portion}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-200 block">
                      ₹{item.priceAtOrder * item.quantity}
                    </span>
                    <span className="text-[10px] text-slate-500">₹{item.priceAtOrder} each</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Status Update Actions */}
          {onStatusChange && order.status !== 'COMPLETED' && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Update Order Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onStatusChange(order.id, 'PREPARING')}
                  disabled={order.status === 'PREPARING'}
                  className="py-2.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 active:bg-amber-500/40 disabled:opacity-40 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-extrabold transition-all shadow-sm active:ring-2 active:ring-amber-500"
                >
                  Mark Preparing 👨‍🍳
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onStatusChange(order.id, 'READY')}
                  disabled={order.status === 'READY'}
                  className="py-2.5 px-3 bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 disabled:opacity-40 text-blue-400 border border-blue-500/40 rounded-xl text-xs font-extrabold transition-all shadow-sm active:ring-2 active:ring-blue-500"
                >
                  Mark Ready 🍽️
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onStatusChange(order.id, 'COMPLETED')}
                  className="py-2.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-extrabold transition-all shadow-sm active:ring-2 active:ring-emerald-500"
                >
                  Mark Completed ✨
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
