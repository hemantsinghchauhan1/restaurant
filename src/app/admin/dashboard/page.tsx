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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Admin Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-50 flex items-center gap-2">
                <span>Admin Control Panel</span>
                <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold px-2 py-0.5 rounded-full">
                  FULL ACCESS
                </span>
              </h1>
              <p className="text-xs text-slate-400">Platform metrics & management</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Revenue & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('MANAGERS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'MANAGERS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manager Approvals ({managers.filter((m) => m.status === 'PENDING').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MENU')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'MENU'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Menu Management</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL_ORDERS')}
            className={`py-3 px-5 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all ${
              activeTab === 'ALL_ORDERS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Orders Log</span>
          </button>
        </div>

        {/* TAB 1: ANALYTICS OVERVIEW */}
        {activeTab === 'ANALYTICS' && analytics && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Total Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-slate-50">₹{analytics.summary.totalRevenue}</div>
                <div className="text-[10px] text-emerald-400 font-semibold">From completed orders</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Completed Orders</span>
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-slate-50">{analytics.summary.completedOrdersCount}</div>
                <div className="text-[10px] text-slate-500">Out of {analytics.summary.totalOrdersCount} placed</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Avg Order Value</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-slate-50">₹{analytics.summary.avgOrderValue}</div>
                <div className="text-[10px] text-slate-500">Per transaction</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Conversion Rate</span>
                  <Eye className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-slate-50">{analytics.summary.conversionRate}%</div>
                <div className="text-[10px] text-purple-400 font-semibold">
                  {analytics.summary.totalMenuViews} menu sessions
                </div>
              </div>
            </div>

            {/* Graphs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Revenue Bar Chart */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-base font-extrabold text-slate-100">Revenue Trends</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.revenueTrends}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      />
                      <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Split Pie Chart */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-base font-extrabold text-slate-100">Payment Breakdown (Online vs Cash)</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.paymentSplit}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {analytics.paymentSplit.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Purchased Dishes List */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <h3 className="text-base font-extrabold text-slate-100">Top Performing Dishes</h3>
              <div className="space-y-3">
                {analytics.topDishes.map((dish, i) => (
                  <div
                    key={dish.name}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 font-black flex items-center justify-center text-xs">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-slate-200">{dish.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-amber-400 block">{dish.quantity} sold</span>
                      <span className="text-[10px] text-slate-500">₹{dish.revenue} total</span>
                    </div>
                  </div>
                ))}
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

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 divide-y divide-slate-800 shadow-xl">
              {allOrders.map((ord: any) => (
                <div
                  key={ord.id}
                  onClick={() => {
                    setSelectedOrderForInspection(ord);
                    setShowOrderModal(true);
                  }}
                  className="py-3.5 px-3 flex items-center justify-between text-xs hover:bg-slate-800/80 rounded-2xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-amber-400 font-bold group-hover:border-amber-500/40 transition-colors">
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
                </div>
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

              <div>
                <label className="text-slate-400 block mb-1">Image URL</label>
                <input
                  type="url"
                  value={dishForm.imageUrl}
                  onChange={(e) => setDishForm({ ...dishForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg mt-2"
              >
                Save Dish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
