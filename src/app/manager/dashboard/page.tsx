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
  CreditCard,
  Power,
  Bell,
  Menu,
  X,
  TrendingUp,
  BarChart3,
  Settings,
  HelpCircle,
  Home,
  MoreHorizontal,
  ChevronRight,
  Filter,
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
  const [activeTab, setActiveTab] = useState<'KITCHEN' | 'CASH_VERIFY' | 'STOCK' | 'ANALYTICS' | 'HISTORY'>('KITCHEN');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [cashOrders, setCashOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalOrdersCount: number;
    totalRevenue: number;
    onlinePayments: number;
    cashPayments: number;
    onlinePercentage: number;
    cashPercentage: number;
    hourlyRevenue: number[];
    topSellingItems: { id: string; name: string; quantity: number; revenue: number }[];
  } | null>(null);

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
    // 0ms Instant Optimistic UI toggle!
    const nextState = !onlinePaymentEnabled;
    setOnlinePaymentEnabled(nextState);
    setActionMessage(
      nextState
        ? '⚡ Online UPI & Card payments are now ENABLED for all customers.'
        : '🔒 Online payments are now DISABLED. Store is operating in CASH ONLY MODE.'
    );
    setTimeout(() => setActionMessage(''), 4000);

    setIsTogglingPayment(true);
    try {
      const res = await fetch('/api/manager/settings/online-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlinePaymentEnabled: nextState }),
      });
      if (!res.ok) {
        setOnlinePaymentEnabled(!nextState);
      }
    } catch {
      setOnlinePaymentEnabled(!nextState);
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

  // Audio chime player for incoming orders
  const prevKitchenCountRef = useRef<number>(0);
  const prevCashCountRef = useRef<number>(0);

  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // Audio autoplay restrictions handle gracefully
    }
  };

  // Fetch Manager Auth User
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user && (data.user.role === 'MANAGER' || data.user.role === 'ADMIN')) {
          setUser(data.user);
        } else {
          router.push('/manager/login');
        }
      })
      .catch(() => router.push('/manager/login'));
  }, [router]);

  // Fetch Dishes for stock management
  const fetchDishes = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.categories) {
        const allDishes: Dish[] = [];
        data.categories.forEach((cat: any) => {
          cat.dishes.forEach((d: any) => {
            allDishes.push({
              id: d.id,
              name: d.name,
              category: { name: cat.name },
              price: d.price,
              inStock: d.inStock,
              imageUrl: d.imageUrl,
            });
          });
        });
        setDishes(allDishes);
      }
    } catch (err) {
      console.error('Error fetching dishes:', err);
    }
  };

  // Fetch Orders for Kitchen, Cash Verification, and History
  const fetchAllOrders = async () => {
    try {
      const [resKitchen, resCash, resHistory] = await Promise.all([
        fetch('/api/manager/orders?filter=active'),
        fetch('/api/manager/orders?filter=cash_pending'),
        fetch('/api/manager/orders?filter=history'),
      ]);

      const [dataKitchen, dataCash, dataHistory] = await Promise.all([
        resKitchen.json(),
        resCash.json(),
        resHistory.json(),
      ]);

      if (dataKitchen.orders) {
        // Trigger chime if new orders arrive
        if (
          prevKitchenCountRef.current > 0 &&
          dataKitchen.orders.length > prevKitchenCountRef.current
        ) {
          playChime();
        }
        prevKitchenCountRef.current = dataKitchen.orders.length;
        setKitchenOrders(dataKitchen.orders);
      }

      if (dataCash.orders) {
        if (
          prevCashCountRef.current > 0 &&
          dataCash.orders.length > prevCashCountRef.current
        ) {
          playChime();
        }
        prevCashCountRef.current = dataCash.orders.length;
        setCashOrders(dataCash.orders);
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

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/manager/analytics');
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchDishes();
    fetchAnalytics();

    // Poll live manager feed every 3.5 seconds
    const interval = setInterval(() => {
      fetchAllOrders();
      fetchAnalytics();
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    // 0ms Optimistic UI update
    setKitchenOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    setActionMessage(`Order status updated to ${status}`);
    setTimeout(() => setActionMessage(''), 3000);

    try {
      const res = await fetch(`/api/manager/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        fetchAllOrders();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      fetchAllOrders();
    }
  };

  const handleToggleStock = async (dishId: string, currentStock: boolean) => {
    // 0ms Optimistic UI update
    const nextStock = !currentStock;
    setDishes((prev) =>
      prev.map((d) => (d.id === dishId ? { ...d, inStock: nextStock } : d))
    );

    try {
      const res = await fetch(`/api/menu/dish/${dishId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: nextStock }),
      });
      if (!res.ok) {
        setDishes((prev) =>
          prev.map((d) => (d.id === dishId ? { ...d, inStock: currentStock } : d))
        );
      }
    } catch (err) {
      console.error('Stock update failed:', err);
      setDishes((prev) =>
        prev.map((d) => (d.id === dishId ? { ...d, inStock: currentStock } : d))
      );
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/manager/login');
  };

  // Search filtering logic for Kitchen Queue (with FIFO urgency sort)
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

  // Calculate elapsed time formatted (e.g. "2 mins ago")
  const getTimeAgo = (dateStr: string) => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 pb-24 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Slide-over Mobile Navigation Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-y-0 left-0 w-80 bg-[#0f1420] border-r border-[#1e2638] p-6 flex flex-col justify-between shadow-2xl z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shadow-md">
                      M
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-100">{user?.name || 'Manager'}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">ONLINE</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1.5 pt-2">
                  <button
                    onClick={() => { setActiveTab('KITCHEN'); setIsDrawerOpen(false); }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                      activeTab === 'KITCHEN' ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ChefHat className="w-4 h-4" />
                      <span>Kitchen Queue</span>
                    </div>
                    {kitchenOrders.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-950 text-amber-400">
                        {kitchenOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('CASH_VERIFY'); setIsDrawerOpen(false); }}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                      activeTab === 'CASH_VERIFY' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Banknote className="w-4 h-4" />
                      <span>Cash Verification</span>
                    </div>
                    {cashOrders.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-950 text-emerald-400">
                        {cashOrders.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('STOCK'); setIsDrawerOpen(false); }}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${
                      activeTab === 'STOCK' ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/20' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Stock Management</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('ANALYTICS'); setIsDrawerOpen(false); }}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${
                      activeTab === 'ANALYTICS' ? 'bg-purple-500 text-slate-950 font-black shadow-lg shadow-purple-500/20' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Reports & Analytics</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('HISTORY'); setIsDrawerOpen(false); }}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${
                      activeTab === 'HISTORY' ? 'bg-slate-800 text-slate-100 font-black' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Completed History</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-6 border-t border-slate-800/80">
                <button
                  onClick={handleLogout}
                  className="w-full p-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Top Manager Header Bar */}
      <header className="bg-[#0f1420]/90 border-b border-[#1e2638] p-4 px-4 sm:px-6 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-700 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">Good Morning, Manager 👋</span>
              <h1 className="text-lg font-black text-slate-50 flex items-center gap-2">
                <span>Manager Dashboard</span>
                <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  LIVE FEED
                </span>
              </h1>
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
              <span className="hidden sm:inline">{onlinePaymentEnabled ? 'Online Payments: ACTIVE' : 'CASH ONLY MODE'}</span>
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
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-colors"
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

        {/* Store Payment Control Banner Card */}
        <div className="bg-[#121722] border border-[#1e2638] p-4 sm:p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-2xl border ${onlinePaymentEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wider">ONLINE PAYMENTS GATEWAY</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${onlinePaymentEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                  {onlinePaymentEnabled ? 'ONLINE ACTIVE' : 'CASH ONLY MODE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {onlinePaymentEnabled
                  ? 'Customers can pay online via UPI / GPay / Cards or Cash at Table.'
                  : 'Online UPI/Card payment option is currently DISABLED. Customers can only order with Cash.'}
              </p>
            </div>
          </div>

          <button
            disabled={isTogglingPayment}
            onClick={handleToggleOnlinePayment}
            className={`w-full md:w-auto px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shrink-0 ${
              onlinePaymentEnabled
                ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 shadow-rose-950/40'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isTogglingPayment ? (
              <span className="inline-block animate-spin font-bold">↻</span>
            ) : onlinePaymentEnabled ? (
              <>
                <Power className="w-4 h-4 text-rose-400" />
                <span>TURN OFF ONLINE PAYMENTS (CASH ONLY)</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>TURN ON ONLINE PAYMENTS (ENABLE UPI)</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Executive Stats Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => setActiveTab('KITCHEN')}
            className="bg-[#121722] border border-[#1e2638] hover:border-amber-500/40 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all shadow-lg"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">KITCHEN QUEUE</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-amber-400">{kitchenOrders.length}</span>
                <span className="text-xs text-slate-400 font-semibold">Active</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('CASH_VERIFY')}
            className="bg-[#121722] border border-[#1e2638] hover:border-emerald-500/40 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all shadow-lg"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CASH VERIFICATIONS</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400">{cashOrders.length}</span>
                <span className="text-xs text-slate-400 font-semibold">Pending</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Banknote className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={() => setActiveTab('STOCK')}
            className="bg-[#121722] border border-[#1e2638] hover:border-sky-500/40 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all shadow-lg"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IN-STOCK DISHES</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-sky-400">
                  {dishes.filter((d) => d.inStock).length}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/{dishes.length}</span>
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Utensils className="w-5 h-5" />
            </div>
          </div>

          <div
            onClick={handleToggleOnlinePayment}
            className="bg-[#121722] border border-[#1e2638] hover:border-emerald-500/40 p-4 rounded-3xl flex items-center justify-between cursor-pointer transition-all shadow-lg"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PAYMENT GATEWAY</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                  onlinePaymentEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}>
                  {onlinePaymentEnabled ? 'UPI ACTIVE' : 'CASH ONLY'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-2xl border ${
              onlinePaymentEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('KITCHEN')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'KITCHEN'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-[#121722] border border-[#1e2638] text-slate-400 hover:text-slate-200'
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
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-[#121722] border border-[#1e2638] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash Verification</span>
            {cashOrders.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-slate-950 text-emerald-400">
                {cashOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('STOCK')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'STOCK'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20'
                : 'bg-[#121722] border border-[#1e2638] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Stock Management</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20'
                : 'bg-[#121722] border border-[#1e2638] text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports & Analytics</span>
          </button>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="py-3 px-4 rounded-2xl text-xs font-bold bg-[#121722] border border-[#1e2638] text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>More</span>
          </button>
        </div>

        {/* TAB 1: KITCHEN QUEUE */}
        {activeTab === 'KITCHEN' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-100">Active Kitchen Orders</h2>
                <p className="text-xs text-slate-400">Sequential FIFO order queue currently in preparation</p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search order #, table, customer..."
                  value={searchKitchen}
                  onChange={(e) => setSearchKitchen(e.target.value)}
                  className="w-full bg-[#121722] border border-[#1e2638] rounded-2xl pl-10 pr-9 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
                {searchKitchen && (
                  <button onClick={() => setSearchKitchen('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {filteredKitchenOrders.length === 0 ? (
              <div className="p-12 text-center bg-[#121722] border border-[#1e2638] rounded-3xl space-y-3">
                <ChefHat className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No active kitchen orders match your search</p>
                <p className="text-xs text-slate-500">Verified cash & online orders will appear here automatically</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredKitchenOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#121722] border border-[#1e2638] hover:border-amber-500/30 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-xl relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Card Top Row: Order Number & Table Number */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-amber-400">
                            <HighlightText text={order.orderNumber || `#${order.id.slice(0, 5)}`} query={searchKitchen} />
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                            {order.orderType}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.tableNumber && (
                            <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                              Table {order.tableNumber}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(order.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Customer Info & Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          <HighlightText text={order.customerName || 'Dine-in Customer'} query={searchKitchen} />
                        </span>

                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                          order.status === 'PREPARING'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse'
                            : order.status === 'READY'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                        }`}>
                          {order.status}
                        </span>
                      </div>

                      {/* Bulleted Item List */}
                      <div className="bg-[#0b0e14] p-3 rounded-2xl space-y-1.5 border border-[#1a202c]">
                        {order.items.map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="text-slate-300 font-medium">{item.dish?.name}</span>
                              {item.portion && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                                  {item.portion}
                                </span>
                              )}
                            </div>
                            <span className="font-extrabold text-slate-200">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-[#1e2638] flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Est. {order.estimatedWaitMinutes || 10} mins</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrderForInspection(order);
                            setShowOrderModal(true);
                          }}
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            className="py-2 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 transform active:scale-95"
                          >
                            MARK PREPARING
                          </button>
                        )}

                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'READY')}
                            className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 transform active:scale-95"
                          >
                            MARK AS READY
                          </button>
                        )}

                        {order.status === 'READY' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                            className="py-2 px-3.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md shadow-purple-500/20 transform active:scale-95"
                          >
                            MARK AS SERVED
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CASH VERIFICATION QUEUE */}
        {activeTab === 'CASH_VERIFY' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-100">Cash Verification Queue</h2>
                <p className="text-xs text-slate-400">Verify customer cash reference at counter to release order to kitchen</p>
              </div>

              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search temp ref T-XXXX, table, phone..."
                  value={searchCash}
                  onChange={(e) => setSearchCash(e.target.value)}
                  className="w-full bg-[#121722] border border-[#1e2638] rounded-2xl pl-10 pr-9 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>

            {filteredCashOrders.length === 0 ? (
              <div className="p-12 text-center bg-[#121722] border border-[#1e2638] rounded-3xl space-y-3">
                <Banknote className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-400">No pending cash verifications</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCashOrders.map((order) => (
                  <div key={order.id} className="bg-[#121722] border border-emerald-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between pb-3 border-b border-[#1e2638]">
                      <span className="text-base font-black text-emerald-400">
                        <HighlightText text={order.tempRef || `#${order.id.slice(0, 5)}`} query={searchCash} />
                      </span>
                      {order.tableNumber && (
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30">
                          Table {order.tableNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">Total Bill Amount</span>
                      <span className="text-lg font-black text-amber-400">₹{order.totalAmount}</span>
                    </div>

                    <button
                      onClick={() => handleVerifyCash(order.tempRef || order.id)}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20 transform active:scale-95 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CONFIRM CASH & RELEASE TO KITCHEN QUEUE</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STOCK MANAGEMENT */}
        {activeTab === 'STOCK' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-100">Stock Availability Management</h2>
                <p className="text-xs text-slate-400">Toggle dish availability live across customer QR menus</p>
              </div>

              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter dish by name or category..."
                  value={searchStock}
                  onChange={(e) => setSearchStock(e.target.value)}
                  className="w-full bg-[#121722] border border-[#1e2638] rounded-2xl pl-10 pr-9 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    dish.inStock
                      ? 'bg-[#121722] border-[#1e2638]'
                      : 'bg-rose-950/20 border-rose-900/40 opacity-70'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {dish.category.name}
                    </span>
                    <h4 className={`text-xs font-bold truncate ${dish.inStock ? 'text-slate-100' : 'text-rose-300 line-through'}`}>
                      {dish.name}
                    </h4>
                    <span className="text-xs font-black text-amber-400">₹{dish.price}</span>
                  </div>

                  <button
                    onClick={() => handleToggleStock(dish.id, dish.inStock)}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${
                      dish.inStock
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {dish.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: REPORTS & ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-100">Reports & Analytics</h2>
              <p className="text-xs text-slate-400">Live store revenue, order volume, and top selling dishes from database</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121722] border border-[#1e2638] p-5 rounded-3xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
                <span className="text-3xl font-black text-slate-50 block">
                  {analytics?.totalOrdersCount ?? (kitchenOrders.length + cashOrders.length + historyOrders.length)}
                </span>
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Live Store Orders
                </span>
              </div>

              <div className="bg-[#121722] border border-[#1e2638] p-5 rounded-3xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
                <span className="text-3xl font-black text-amber-400 block">
                  ₹ {(analytics?.totalRevenue ?? historyOrders.reduce((s, o) => s + o.totalAmount, 0)).toLocaleString()}
                </span>
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Verified Revenue
                </span>
              </div>

              <div className="bg-[#121722] border border-[#1e2638] p-5 rounded-3xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Online Payments</span>
                <span className="text-3xl font-black text-emerald-400 block">
                  {analytics?.onlinePayments ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {analytics?.onlinePercentage ?? 0}% of total volume
                </span>
              </div>

              <div className="bg-[#121722] border border-[#1e2638] p-5 rounded-3xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cash Payments</span>
                <span className="text-3xl font-black text-sky-400 block">
                  {analytics?.cashPayments ?? 0}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {analytics?.cashPercentage ?? 0}% of total volume
                </span>
              </div>
            </div>

            {/* Top Selling Items Card */}
            {analytics?.topSellingItems && analytics.topSellingItems.length > 0 && (
              <div className="bg-[#121722] border border-[#1e2638] p-5 rounded-3xl space-y-3">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">Top Selling Dishes (Live DB Data)</h3>
                <div className="space-y-2">
                  {analytics.topSellingItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#0b0e14] border border-[#1a202c]">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-black flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="text-xs font-extrabold text-slate-200">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">{item.quantity} ordered</span>
                        <span className="text-xs font-black text-amber-400">₹{item.revenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revenue Trend SVG Line Chart */}
            <div className="bg-[#121722] border border-[#1e2638] p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-200">Revenue Overview</h3>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Today's Timeline
                </span>
              </div>
              <div className="h-44 w-full relative pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,110 Q 75,40 150,85 T 300,50 T 450,20 L 450,150 L 0,150 Z"
                    fill="url(#chartGrad)"
                  />
                  <path
                    d="M 0,110 Q 75,40 150,85 T 300,50 T 450,20"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                  />
                  <circle cx="450" cy="20" r="5" fill="#f59e0b" className="animate-ping" />
                  <circle cx="450" cy="20" r="5" fill="#f59e0b" />
                </svg>
              </div>
              <div className="flex justify-between text-[11px] font-bold text-slate-500 border-t border-slate-800/80 pt-2">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>12 AM</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Mobile Floating Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#0f1420]/95 border-t border-[#1e2638] p-2 sm:hidden z-40 backdrop-blur-md">
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('KITCHEN')}
            className={`py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
              activeTab === 'KITCHEN' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px]">Home</span>
          </button>

          <button
            onClick={() => setActiveTab('KITCHEN')}
            className={`py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
              activeTab === 'KITCHEN' ? 'text-amber-400 font-extrabold' : 'text-slate-400'
            }`}
          >
            <ChefHat className="w-5 h-5" />
            <span className="text-[10px]">Kitchen</span>
          </button>

          <button
            onClick={() => setActiveTab('CASH_VERIFY')}
            className={`py-2 flex flex-col items-center gap-1 rounded-xl transition-all relative ${
              activeTab === 'CASH_VERIFY' ? 'text-emerald-400 font-extrabold' : 'text-slate-400'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span className="text-[10px]">Cash</span>
            {cashOrders.length > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('STOCK')}
            className={`py-2 flex flex-col items-center gap-1 rounded-xl transition-all ${
              activeTab === 'STOCK' ? 'text-sky-400 font-extrabold' : 'text-slate-400'
            }`}
          >
            <Utensils className="w-5 h-5" />
            <span className="text-[10px]">Stock</span>
          </button>

          <button
            onClick={() => setIsDrawerOpen(true)}
            className="py-2 flex flex-col items-center gap-1 rounded-xl text-slate-400 hover:text-slate-200"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>

      {/* Comprehensive Order Inspection Modal */}
      {selectedOrderForInspection && (
        <ComprehensiveOrderModal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          order={selectedOrderForInspection}
          onStatusChange={handleUpdateStatus}
        />
      )}
    </div>
  );
}
