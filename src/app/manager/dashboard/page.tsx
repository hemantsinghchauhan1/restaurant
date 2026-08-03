'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Banknote,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  LogOut,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Utensils,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { ComprehensiveOrderModal } from '@/components/admin/ComprehensiveOrderModal';
import { filterOrders } from '@/lib/orderSearch';
import { HighlightText } from '@/components/ui/HighlightText';

interface ManagerUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OrderItem {
  id: string;
  dish: {
    name: string;
    isVeg: boolean;
  };
  quantity: number;
  priceAtOrder: number;
  portion?: string;
  notes?: string;
}

interface Order {
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
  customerName: string | null;
  items: OrderItem[];
}

interface Dish {
  id: string;
  name: string;
  category: { name: string };
  price: number;
  inStock: boolean;
  imageUrl: string;
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<ManagerUser | null>(null);
  const [activeTab, setActiveTab] = useState<'KITCHEN' | 'CASH_VERIFY' | 'STOCK' | 'HISTORY'>('KITCHEN');

  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [cashOrders, setCashOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);

  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [isTogglingPayment, setIsTogglingPayment] = useState(false);

  useEffect(() => {
    fetch('/api/manager/settings/online-payment')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.onlinePaymentEnabled === 'boolean') {
          setOnlinePaymentEnabled(data.onlinePaymentEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleOnlinePayment = async () => {
    setIsTogglingPayment(true);
    try {
      const nextState = !onlinePaymentEnabled;
      const res = await fetch('/api/manager/settings/online-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlinePaymentEnabled: nextState }),
      });
      if (res.ok) {
        setOnlinePaymentEnabled(nextState);
        setActionMessage(
          nextState
            ? 'Online UPI payments are now ENABLED for customers.'
            : 'Online payments are now DISABLED. Customers can only order via CASH mode.'
        );
      }
    } catch {
      // ignore
    } finally {
      setIsTogglingPayment(false);
    }
  };

  const [searchKitchen, setSearchKitchen] = useState('');
  const [searchCash, setSearchCash] = useState('');
  const [searchStock, setSearchStock] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [selectedOrderForInspection, setSelectedOrderForInspection] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const previousCashCountRef = useRef(0);
  const previousKitchenCountRef = useRef(0);

  // Audio chime for live incoming order alerts
  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch {
      // ignore
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated || !data.user) {
        router.push('/manager/login');
        return;
      }
      const role = data.user.role;
      if (role !== 'MANAGER' && role !== 'ADMIN') {
        if (role === 'CHEF') router.push('/kitchen/dashboard');
        else router.push('/customer/dashboard');
        return;
      }
      setUser(data.user);
    } catch {
      router.push('/manager/login');
    }
  };

  const fetchAllOrders = async () => {
    try {
      // Fetch kitchen active orders (CONFIRMED, PREPARING, READY)
      const resKitchen = await fetch('/api/manager/orders?filter=active');
      const dataKitchen = await resKitchen.json();

      // Fetch pending cash orders (AWAITING_CASH_VERIFICATION)
      const resCash = await fetch('/api/manager/orders?filter=cash_pending');
      const dataCash = await resCash.json();

      // Fetch history orders
      const resHistory = await fetch('/api/manager/orders?filter=history');
      const dataHistory = await resHistory.json();

      if (dataCash.orders) {
        if (dataCash.orders.length > previousCashCountRef.current && previousCashCountRef.current !== 0) {
          playChime();
        }
        previousCashCountRef.current = dataCash.orders.length;
        setCashOrders(dataCash.orders);
      }

      if (dataKitchen.orders) {
        // Filter kitchen to confirmed, preparing, ready only
        const activeKitchenOnly = dataKitchen.orders.filter(
          (o: Order) => o.status !== 'AWAITING_CASH_VERIFICATION'
        );
        if (activeKitchenOnly.length > previousKitchenCountRef.current && previousKitchenCountRef.current !== 0) {
          playChime();
        }
        previousKitchenCountRef.current = activeKitchenOnly.length;
        setKitchenOrders(activeKitchenOnly);
      }

      if (dataHistory.orders) {
        setHistoryOrders(dataHistory.orders);
      }
    } catch (err) {
      console.error('Error fetching manager orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDishes = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.categories) {
        let allDishes: Dish[] = [];
        data.categories.forEach((cat: { name: string; dishes: Dish[] }) => {
          allDishes = allDishes.concat(
            cat.dishes.map((d) => ({ ...d, category: { name: cat.name } }))
          );
        });
        setDishes(allDishes);
      }
    } catch (err) {
      console.error('Error fetching dishes:', err);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchDishes();
  }, []);

  useEffect(() => {
    fetchAllOrders();

    // Poll live manager feed every 3.5 seconds
    const interval = setInterval(() => {
      fetchAllOrders();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/manager/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setActionMessage(`Order status updated to ${status}`);
        setTimeout(() => setActionMessage(''), 3000);
        fetchAllOrders();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleVerifyCash = async (orderIdOrTempRef: string) => {
    try {
      const res = await fetch(`/api/manager/orders/${orderIdOrTempRef}/verify-cash`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`✅ Cash Payment Verified! Permanent Order ${data.order?.orderNumber || ''} created & sent to Kitchen Queue.`);
        setTimeout(() => setActionMessage(''), 4000);
        fetchAllOrders();
      } else {
        alert(data.error || 'Failed to verify cash');
      }
    } catch (err) {
      console.error('Cash verification failed:', err);
    }
  };

  const handleToggleStock = async (dishId: string, currentStock: boolean) => {
    try {
      const res = await fetch(`/api/menu/dish/${dishId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: !currentStock }),
      });
      if (res.ok) {
        setDishes((prev) =>
          prev.map((d) => (d.id === dishId ? { ...d, inStock: !currentStock } : d))
        );
      }
    } catch (err) {
      console.error('Stock update failed:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/manager/login');
  };

  // Search filtering logic for Kitchen Queue (with urgency sort)
  const filteredKitchenOrders = filterOrders(kitchenOrders, {
    query: searchKitchen,
    urgencySort: true,
  });

  // Search filtering logic for Cash Verification Queue
  const filteredCashOrders = filterOrders(cashOrders, {
    query: searchCash,
    urgencySort: true,
  });

  // Search filtering logic for Stock Management
  const filteredDishes = dishes.filter((d) => {
    if (!searchStock.trim()) return true;
    const q = searchStock.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.category.name.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Manager Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-4 sm:px-6 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-50 flex items-center gap-2">
                <span>Manager Dashboard</span>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  LIVE FEED
                </span>
              </h1>
              <p className="text-xs text-slate-400">{user?.name || 'Floor Manager'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={isTogglingPayment}
              onClick={handleToggleOnlinePayment}
              className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-extrabold transition-all transform active:scale-95 shadow-md ${
                onlinePaymentEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30'
              }`}
              title="Toggle Online UPI Payments for Customers"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${onlinePaymentEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span>{onlinePaymentEnabled ? 'Online Payments: ACTIVE' : 'CASH ONLY MODE'}</span>
            </button>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2.5 rounded-2xl border flex items-center gap-1.5 text-xs font-bold transition-all ${
                audioEnabled
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{audioEnabled ? 'Alert Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionMessage}</span>
          </motion.div>
        )}

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('KITCHEN')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'KITCHEN'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Kitchen Queue</span>
            {kitchenOrders.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-slate-950 text-amber-400">
                {kitchenOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('CASH_VERIFY')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'CASH_VERIFY'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash Verification</span>
            {cashOrders.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                {cashOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('STOCK')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'STOCK'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Stock Toggle</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Completed History</span>
          </button>
        </div>

        {/* TAB 1: KITCHEN QUEUE */}
        {activeTab === 'KITCHEN' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-200">Active Kitchen Orders</h2>
                <p className="text-xs text-slate-400">Sequential order queue currently in preparation</p>
              </div>

              {/* Search Bar for Kitchen Orders */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search order #, table, customer..."
                  value={searchKitchen}
                  onChange={(e) => setSearchKitchen(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {filteredKitchenOrders.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-400">No active kitchen orders match your search</h3>
                <p className="text-xs text-slate-600">Verified cash & online orders will appear here automatically</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredKitchenOrders.map((ord, idx) => (
                  <motion.div
                    key={ord.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl relative overflow-hidden"
                  >
                    {/* Sequence Badge */}
                    <div className="absolute top-0 right-0 bg-amber-500/10 border-l border-b border-amber-500/30 text-amber-400 font-mono font-bold text-[10px] px-3 py-1 rounded-bl-xl">
                      Queue #{idx + 1}
                    </div>

                    <div className="flex items-start justify-between pr-12">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-black text-slate-50">
                            <HighlightText text={ord.orderNumber || ord.tempRef} query={searchKitchen} />
                          </span>
                          <span className="text-[10px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                            {ord.orderType} {ord.tableNumber ? `• T-${ord.tableNumber}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>Placed {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-amber-400/90 font-semibold">Est: {ord.estimatedWaitMinutes}m</span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full border ${
                          ord.status === 'CONFIRMED'
                            ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                            : ord.status === 'PREPARING'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 animate-pulse'
                            : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    {/* Items Breakdown */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                      {ord.items.map((it: any) => (
                        <div key={it.id} className="flex items-start justify-between text-xs">
                          <div>
                            <span className="font-bold text-amber-400 mr-2">{it.quantity}x</span>
                            <span className="text-slate-200 font-semibold">{it.dish.name}</span>
                            {it.portion && (
                              <span className="ml-1.5 text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded">
                                {it.portion}
                              </span>
                            )}
                            {it.notes && (
                              <div className="text-[11px] text-amber-300/80 italic mt-0.5">Note: {it.notes}</div>
                            )}
                          </div>
                          <span className="font-bold text-slate-400">₹{it.priceAtOrder * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2">
                      {ord.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'PREPARING')}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <ChefHat className="w-4 h-4" />
                          <span>Start Preparing</span>
                        </button>
                      )}

                      {ord.status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'READY')}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <Utensils className="w-4 h-4" />
                          <span>Mark Order Ready</span>
                        </button>
                      )}

                      {ord.status === 'READY' && (
                        <button
                          onClick={() => handleUpdateStatus(ord.id, 'COMPLETED')}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Served & Complete</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DEDICATED CASH VERIFICATION QUEUE */}
        {activeTab === 'CASH_VERIFY' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-200">Pending Cash Verification</h2>
                <p className="text-xs text-slate-400">Verify counter cash to generate permanent order # & release to Kitchen</p>
              </div>

              {/* Search Bar for Cash Orders */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search cash ref (e.g. CASH-0801-001)..."
                  value={searchCash}
                  onChange={(e) => setSearchCash(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {filteredCashOrders.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                <Banknote className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-400">No cash orders pending verification</h3>
                <p className="text-xs text-slate-600">Customer cash references will appear here live</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCashOrders.map((cashOrd) => (
                  <motion.div
                    key={cashOrd.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-amber-500/40 p-5 rounded-3xl space-y-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold tracking-wider">CASH REF CODE</span>
                        <span className="text-2xl font-black text-amber-400 font-mono tracking-tight">{cashOrd.tempRef}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-bold tracking-wider">COLLECT CASH</span>
                        <span className="text-2xl font-black text-emerald-400">₹{cashOrd.totalAmount}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center justify-between">
                      <span>Type: <strong>{cashOrd.orderType}</strong> {cashOrd.tableNumber ? `(Table #${cashOrd.tableNumber})` : ''}</span>
                      <span>Customer: <strong>{cashOrd.customerName || 'Walk-in'}</strong></span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                      {cashOrd.items.map((it: any) => (
                        <div key={it.id} className="flex items-center justify-between">
                          <span className="text-slate-300 font-medium">
                            <strong className="text-amber-400 mr-1.5">{it.quantity}x</strong>
                            {it.dish.name} {it.portion ? `(${it.portion})` : ''}
                          </span>
                          <span className="font-bold text-slate-400">₹{it.priceAtOrder * it.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleVerifyCash(cashOrd.id)}
                      className="w-full bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirm Cash & Release to Kitchen Queue</span>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STOCK MANAGEMENT */}
        {activeTab === 'STOCK' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-200">Stock Availability Control</h2>
                <p className="text-xs text-slate-400">Instantly search & toggle menu dishes In-Stock or Out-of-Stock</p>
              </div>

              {/* Search Bar for Stock Dishes */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search dish name (e.g. Paneer, Roti)..."
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {filteredDishes.length === 0 ? (
              <div className="p-12 text-center bg-slate-900/60 border border-slate-800 rounded-3xl space-y-2">
                <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-400">No dishes match "{searchStock}"</h3>
                <p className="text-xs text-slate-600">Try searching for another dish name or category</p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800">
                {filteredDishes.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className={`text-sm font-bold transition-all duration-300 ${
                        d.inStock ? 'text-slate-200' : 'text-slate-500 line-through decoration-rose-500/60 decoration-2'
                      }`}>{d.name}</h4>
                      <span className="text-xs text-slate-500">{d.category.name} • ₹{d.price}</span>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleToggleStock(d.id, d.inStock)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all duration-300 ${
                        d.inStock
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full transition-colors ${d.inStock ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                      <span>{d.inStock ? 'In Stock (Available)' : 'Out of Stock (Disabled)'}</span>
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COMPLETED HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-200">Completed Shift Orders Log</h2>
                <p className="text-xs text-slate-400">Click any order row for comprehensive inspection, dish breakdown & timestamps</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                {historyOrders.length} Completed
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 shadow-xl">
              {historyOrders.map((ord) => (
                <motion.div
                  key={ord.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSelectedOrderForInspection(ord);
                    setShowOrderModal(true);
                  }}
                  className="py-3.5 px-3 flex items-center justify-between text-xs bg-slate-950/60 hover:bg-slate-800/90 active:bg-amber-500/10 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl cursor-pointer transition-all group select-none shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-amber-400 font-bold group-hover:border-amber-500/40 transition-colors">
                      <Utensils className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-100 text-sm font-mono group-hover:text-amber-400 transition-colors">
                          {ord.orderNumber || ord.tempRef || ord.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-bold text-amber-500 uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          {ord.orderType}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {ord.items?.length || 0} items • {ord.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="font-black text-emerald-400 text-sm block">₹{ord.totalAmount}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border bg-emerald-950 text-emerald-400 border-emerald-800">
                        {ord.status}
                      </span>
                    </div>
                    <Eye className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Comprehensive Order Inspection Modal */}
      <ComprehensiveOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        order={selectedOrderForInspection}
        onStatusChange={async (orderId, newStatus) => {
          try {
            const res = await fetch(`/api/kitchen/orders/${orderId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
              fetchAllOrders();
              if (selectedOrderForInspection && selectedOrderForInspection.id === orderId) {
                setSelectedOrderForInspection((prev: any) => (prev ? { ...prev, status: newStatus } : null));
              }
            }
          } catch (err) {
            console.error('Status update error:', err);
          }
        }}
      />
    </div>
  );
}
