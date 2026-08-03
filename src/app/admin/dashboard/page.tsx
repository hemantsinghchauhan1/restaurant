'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Utensils,
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  ShoppingBag,
  Eye,
  LogOut,
  X,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { ComprehensiveOrderModal } from '@/components/admin/ComprehensiveOrderModal';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrdersCount: number;
    completedOrdersCount: number;
    avgOrderValue: string | number;
    conversionRate: string;
    totalMenuViews: number;
  };
  paymentSplit: { name: string; value: number }[];
  orderTypeSplit: { name: string; value: number }[];
  revenueTrends: { date: string; revenue: number }[];
  topDishes: { name: string; quantity: number; revenue: number }[];
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
}

interface DishItem {
  id: string;
  categoryId: string;
  category?: { name: string };
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  inStock: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'MANAGERS' | 'MENU' | 'ALL_ORDERS'>('ANALYTICS');

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [allOrders, setAllOrders] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrderForInspection, setSelectedOrderForInspection] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Dish Modal state
  const [showDishModal, setShowDishModal] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    categoryId: '',
    isVeg: true,
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setDishForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        alert(data.error || 'Failed to upload image to Cloudinary');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Error uploading image file');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated || !data.user) {
        router.push('/admin/login');
        return;
      }
      const role = data.user.role;
      if (role !== 'ADMIN') {
        if (role === 'MANAGER') router.push('/manager/dashboard');
        else if (role === 'CHEF') router.push('/kitchen/dashboard');
        else router.push('/customer/dashboard');
        return;
      }
    } catch {
      router.push('/admin/login');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      const data = await res.json();
      if (data.summary) setAnalytics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await fetch('/api/admin/managers');
      const data = await res.json();
      if (data.managers) setManagers(data.managers);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
        let list: DishItem[] = [];
        data.categories.forEach((cat: { id: string; name: string; dishes: DishItem[] }) => {
          list = list.concat(
            cat.dishes.map((d) => ({ ...d, category: { name: cat.name } }))
          );
        });
        setDishes(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.orders) setAllOrders(data.orders);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkAdminAuth();
    fetchAnalytics();
    fetchManagers();
    fetchMenu();
    fetchAllOrders();
    setIsLoading(false);
  }, []);

  const handleManagerStatus = async (managerId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/managers/${managerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchManagers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingDishId ? `/api/menu/dish/${editingDishId}` : '/api/menu/dish';
      const method = editingDishId ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dishForm,
          categoryId: dishForm.categoryId || categories[0]?.id,
          price: Number(dishForm.price),
        }),
      });

      if (res.ok) {
        setShowDishModal(false);
        fetchMenu();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to save dish');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this dish?')) return;
    try {
      const res = await fetch(`/api/menu/dish/${dishId}`, { method: 'DELETE' });
      if (res.ok) fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 relative overflow-hidden font-sans">
      {/* Background Ambient Glow FX */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Admin Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 p-4 px-6 sticky top-0 z-30 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 text-blue-400 rounded-2xl shadow-lg shadow-blue-500/10">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-black text-slate-50 tracking-tight">Admin Executive Command</h1>
                <span className="text-[10px] bg-blue-500/20 border border-blue-500/40 text-blue-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  FULL ACCESS
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>SYSTEM LIVE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Real-time platform metrics, manager controls & master logs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 active:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 rounded-2xl text-slate-400 hover:text-rose-400 transition-all shadow-md flex items-center gap-2 text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 relative z-10">
        {/* Modern Segmented Navigation Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800/80 rounded-3xl backdrop-blur-md overflow-x-auto scrollbar-none shadow-xl">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('ANALYTICS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'ANALYTICS'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            <span>Revenue & Analytics</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('MANAGERS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shrink-0 relative ${
              activeTab === 'MANAGERS'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4 stroke-[2.5]" />
            <span>Manager Approvals</span>
            {managers.filter((m) => m.status === 'PENDING').length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-amber-500 text-slate-950 rounded-full animate-bounce">
                {managers.filter((m) => m.status === 'PENDING').length}
              </span>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('MENU')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'MENU'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Utensils className="w-4 h-4 stroke-[2.5]" />
            <span>Menu Management</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveTab('ALL_ORDERS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === 'ALL_ORDERS'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span>Master Orders Log</span>
            <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-slate-800 text-amber-400 rounded-full border border-slate-700">
              {allOrders.length}
            </span>
          </motion.button>
        </div>

        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === 'ANALYTICS' && analytics && (
          <div className="space-y-6">
            {/* Top Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Revenue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-gradient-to-br from-slate-900 via-emerald-950/20 to-slate-900 border border-emerald-500/30 p-5 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group shadow-emerald-500/5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
                  <span>Total Revenue</span>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
                    <DollarSign className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-50 font-mono tracking-tight">
                    ₹{analytics.summary.totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Calculated 100% from completed orders</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Completed Orders */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 p-5 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group shadow-amber-500/5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
                  <span>Completed Orders</span>
                  <div className="p-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl">
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-50 font-mono tracking-tight">
                    {analytics.summary.completedOrdersCount}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-400">
                    <span className="text-amber-400 font-extrabold">{analytics.summary.totalOrdersCount} Total Placed</span>
                    <span>• {Math.round((analytics.summary.completedOrdersCount / (analytics.summary.totalOrdersCount || 1)) * 100)}% Rate</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Avg Order Value */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900 border border-blue-500/30 p-5 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group shadow-blue-500/5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
                  <span>Avg Order Value</span>
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl">
                    <BarChart className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-50 font-mono tracking-tight">
                    ₹{analytics.summary.avgOrderValue}
                  </div>
                  <div className="text-[11px] text-blue-400 font-bold mt-1">Average spent per customer ticket</div>
                </div>
              </motion.div>

              {/* Card 4: Conversion Rate */}
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 p-5 rounded-3xl space-y-3 shadow-xl relative overflow-hidden group shadow-purple-500/5"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all" />
                <div className="flex items-center justify-between text-slate-400 text-xs font-black uppercase tracking-wider">
                  <span>Menu Conversion</span>
                  <div className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl">
                    <Eye className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-black text-slate-50 font-mono tracking-tight">
                    {analytics.summary.conversionRate}%
                  </div>
                  <div className="text-[11px] text-purple-400 font-bold mt-1">
                    {analytics.summary.totalMenuViews} active menu views
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Bar Chart */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      <span>Revenue Trends</span>
                    </h3>
                    <p className="text-xs text-slate-400">Daily earnings progression across completed orders</p>
                  </div>
                  <span className="text-[11px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                    Live Sync
                  </span>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueTrends}>
                      <defs>
                        <linearGradient id="goldBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                          <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#f59e0b40',
                          borderRadius: '16px',
                          color: '#f8fafc',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        }}
                        formatter={(val) => [`₹${val}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="url(#goldBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Split Donut Chart */}
              <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-blue-400" />
                      <span>Payment Breakdown</span>
                    </h3>
                    <p className="text-xs text-slate-400">Distribution between Cash and Online transactions</p>
                  </div>
                </div>

                <div className="h-64 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.paymentSplit}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        stroke="none"
                      >
                        {analytics.paymentSplit.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#090d16',
                          borderColor: '#3b82f640',
                          borderRadius: '16px',
                          color: '#f8fafc',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Donut Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Total Orders</span>
                    <span className="text-xl font-black text-slate-100 font-mono">
                      {analytics.paymentSplit.reduce((acc, curr) => acc + (curr.value || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Purchased Dishes Leaderboard Card */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-amber-400" />
                    <span>Top Performing Dishes Leaderboard</span>
                  </h3>
                  <p className="text-xs text-slate-400">Ranked by volume ordered & total revenue generated</p>
                </div>
              </div>

              <div className="space-y-3">
                {analytics.topDishes.map((dish, i) => {
                  const maxQty = analytics.topDishes[0]?.quantity || 1;
                  const percentage = Math.round((dish.quantity / maxQty) * 100);

                  return (
                    <motion.div
                      key={dish.name}
                      whileHover={{ scale: 1.01, x: 3 }}
                      className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl space-y-2 relative overflow-hidden group shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-xl font-black flex items-center justify-center text-xs shadow-md ${
                              i === 0
                                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                                : i === 1
                                ? 'bg-slate-300 text-slate-950'
                                : i === 2
                                ? 'bg-amber-800 text-amber-200'
                                : 'bg-slate-900 text-slate-500 border border-slate-800'
                            }`}
                          >
                            #{i + 1}
                          </span>
                          <span className="font-extrabold text-slate-100 text-sm group-hover:text-amber-400 transition-colors">
                            {dish.name}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-black text-amber-400 text-sm block font-mono">
                            {dish.quantity} sold
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">₹{dish.revenue} total revenue</span>
                        </div>
                      </div>

                      {/* Leaderboard Contribution Bar */}
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGER APPROVALS */}
        {activeTab === 'MANAGERS' && (
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-slate-200">Manager Account Management</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800">
              {managers.map((mgr) => (
                <div key={mgr.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{mgr.name}</h4>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          mgr.status === 'APPROVED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : mgr.status === 'PENDING'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        }`}
                      >
                        {mgr.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mgr.email} • {mgr.phone || 'No phone'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {mgr.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleManagerStatus(mgr.id, 'APPROVED')}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    )}

                    {mgr.status === 'APPROVED' && (
                      <button
                        onClick={() => handleManagerStatus(mgr.id, 'SUSPENDED')}
                        className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Suspend</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MENU CRUD */}
        {activeTab === 'MENU' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-200">Menu & Pricing Control</h2>
                <p className="text-xs text-slate-400">Add, edit, or remove dishes & prices</p>
              </div>

              <button
                onClick={() => {
                  setEditingDishId(null);
                  setDishForm({
                    name: '',
                    description: '',
                    price: '',
                    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
                    categoryId: categories[0]?.id || '',
                    isVeg: true,
                  });
                  setShowDishModal(true);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Dish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dishes.map((dish) => (
                <div key={dish.id} className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                      <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{dish.name}</h4>
                      <p className="text-xs text-slate-400 font-semibold">₹{dish.price} • {dish.category?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDishId(dish.id);
                        setDishForm({
                          name: dish.name,
                          description: dish.description,
                          price: String(dish.price),
                          imageUrl: dish.imageUrl,
                          categoryId: dish.categoryId,
                          isVeg: dish.isVeg,
                        });
                        setShowDishModal(true);
                      }}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDish(dish.id)}
                      className="p-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-400 rounded-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MASTER ORDER LOG */}
        {activeTab === 'ALL_ORDERS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-200">Master Order History</h2>
                <p className="text-xs text-slate-400">Click any order row for comprehensive inspection, dish breakdown & timestamps</p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                {allOrders.length} Orders Recorded
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2 shadow-xl">
              {allOrders.map((ord: any) => (
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
                      <ShoppingBag className="w-4.5 h-4.5" />
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
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : ord.status === 'PREPARING'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-blue-950 text-blue-400 border-blue-800'
                        }`}
                      >
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

      {/* Dish Add/Edit Modal */}
      {showDishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                {editingDishId ? 'Edit Dish' : 'Add New Dish'}
              </h3>
              <button onClick={() => setShowDishModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Dish Name</label>
                <input
                  type="text"
                  required
                  value={dishForm.name}
                  onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  value={dishForm.description}
                  onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={dishForm.price}
                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={dishForm.categoryId}
                    onChange={(e) => setDishForm({ ...dishForm, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cloudinary Image File Upload + Image URL Input */}
              <div className="space-y-2">
                <label className="text-slate-400 block font-semibold flex items-center justify-between">
                  <span>Dish Image (Cloudinary Storage)</span>
                  {isUploadingImage && (
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading to Cloudinary...
                    </span>
                  )}
                </label>

                {/* Cloudinary Upload Box */}
                <div className="p-3 bg-slate-950 border border-dashed border-slate-800 hover:border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition-all group relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={isUploadingImage}
                  />

                  {dishForm.imageUrl ? (
                    <div className="flex items-center gap-3 w-full p-1">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-amber-500/40 shadow-md">
                        <Image src={dishForm.imageUrl} alt="Dish preview" fill className="object-cover" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-emerald-400 block truncate">
                          ✓ Cloudinary Image Ready
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono block truncate">
                          {dishForm.imageUrl}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-2 text-slate-400 group-hover:text-amber-400 transition-colors">
                      <UploadCloud className="w-6 h-6 mb-1" />
                      <span className="text-xs font-bold text-slate-200">
                        Click or Drag Image to Upload to Cloudinary
                      </span>
                      <span className="text-[10px] text-slate-500">Supports PNG, JPG, WEBP</span>
                    </div>
                  )}
                </div>

                {/* Manual Image URL Input fallback */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 block mb-1">Or paste custom image URL:</span>
                  <input
                    type="text"
                    value={dishForm.imageUrl}
                    onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isUploadingImage}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold py-3 rounded-xl shadow-lg mt-2 transition-all"
              >
                {editingDishId ? 'Update Dish Details' : 'Save & Publish Dish'}
              </motion.button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
