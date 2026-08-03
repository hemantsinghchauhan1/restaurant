'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  LogOut,
  Utensils,
  Flame,
  Bell,
} from 'lucide-react';

interface KitchenItem {
  id: string;
  quantity: number;
  portion?: string;
  notes?: string;
  dish: {
    name: string;
    isVeg: boolean;
  };
}

interface KitchenOrder {
  id: string;
  orderNumber: string | null;
  tempRef: string | null;
  orderType: string;
  tableNumber: string | null;
  status: string;
  estimatedWaitMinutes: number;
  createdAt: string;
  items: KitchenItem[];
}

export default function KitchenDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const previousCountRef = useRef(0);

  // Audio chime for live incoming order alerts in kitchen
  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4); // A5
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // ignore
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/kitchen/login');
      }
    } catch {
      router.push('/kitchen/login');
    }
  };

  const fetchKitchenOrders = async () => {
    try {
      const res = await fetch('/api/kitchen/orders');
      const data = await res.json();
      if (res.ok && data.orders) {
        if (data.orders.length > previousCountRef.current && previousCountRef.current !== 0) {
          playChime();
        }
        previousCountRef.current = data.orders.length;
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Kitchen orders fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchKitchenOrders();

    // Poll live kitchen feed every 3 seconds
    const interval = setInterval(() => {
      fetchKitchenOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setActionMessage(`Order updated to ${status}`);
        setTimeout(() => setActionMessage(''), 2500);
        fetchKitchenOrders();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/kitchen/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Kitchen Screen Sticky Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-4 sm:px-6 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-lg shadow-amber-500/20">
              <ChefHat className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-50 flex items-center gap-2">
                <span>KITCHEN SCREEN</span>
                <span className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                  {orders.length} ACTIVE
                </span>
              </h1>
              <p className="text-xs text-slate-400">Live Chef Order Ticket Stream</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2.5 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                audioEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="hidden sm:inline">{audioEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-extrabold rounded-2xl flex items-center gap-2 shadow-xl"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionMessage}</span>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-900/60 border border-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-24 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-3">
            <Utensils className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-400">All Kitchen Orders Clear!</h3>
            <p className="text-xs text-slate-600">New customer order tickets will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((ord, idx) => {
              const minutesAgo = Math.floor((Date.now() - new Date(ord.createdAt).getTime()) / 60000);
              return (
                <motion.div
                  key={ord.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-slate-900 border p-5 rounded-3xl space-y-4 shadow-2xl flex flex-col justify-between ${
                    ord.status === 'PREPARING'
                      ? 'border-amber-500/80 shadow-amber-500/10'
                      : 'border-slate-800'
                  }`}
                >
                  <div>
                    {/* Order Ticket Header */}
                    <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                            {ord.orderNumber || ord.tempRef}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                          <span className="bg-slate-950 border border-slate-800 px-2.5 py-0.5 rounded-lg text-slate-200">
                            {ord.orderType} {ord.tableNumber ? `• TABLE #${ord.tableNumber}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{minutesAgo}m ago</span>
                        </span>
                        <span
                          className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border block mt-1.5 ${
                            ord.status === 'PREPARING'
                              ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 animate-pulse'
                              : ord.status === 'CONFIRMED'
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                              : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          }`}
                        >
                          {ord.status === 'CONFIRMED' ? 'QUEUED' : ord.status}
                        </span>
                      </div>
                    </div>

                    {/* Dish Items List */}
                    <div className="py-3 space-y-2">
                      {ord.items.map((it) => (
                        <div
                          key={it.id}
                          className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-black text-amber-400">{it.quantity}x</span>
                              <span className="text-sm font-extrabold text-slate-100">{it.dish.name}</span>
                              {it.portion && (
                                <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded">
                                  {it.portion}
                                </span>
                              )}
                            </div>
                            {it.notes && (
                              <div className="text-xs font-bold text-rose-400 italic mt-1 bg-rose-950/40 p-1.5 rounded-lg border border-rose-900/50">
                                ⚠️ Special Request: {it.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chef 1-Tap Status Action Button */}
                  <div className="pt-2">
                    {ord.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform active:scale-98"
                      >
                        <Flame className="w-4 h-4 fill-slate-950" />
                        <span>START COOKING NOW</span>
                      </button>
                    )}

                    {ord.status === 'PREPARING' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'READY')}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                        <span>MARK READY FOR SERVICE</span>
                      </button>
                    )}

                    {ord.status === 'READY' && (
                      <button
                        onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all transform active:scale-98"
                      >
                        <Bell className="w-4 h-4" />
                        <span>SERVED & COMPLETE</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
