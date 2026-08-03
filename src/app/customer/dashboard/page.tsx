'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  ShoppingBag,
  Star,
  Clock,
  ArrowRight,
  LogOut,
  Utensils,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  priceAtOrder: number;
  portion?: string;
  dish: {
    id: string;
    name: string;
    imageUrl: string;
    isVeg: boolean;
  };
}

interface CustomerOrder {
  id: string;
  orderNumber: string | null;
  tempRef: string | null;
  orderType: string;
  tableNumber: string | null;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  estimatedWaitMinutes: number;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  dish: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

interface DishOption {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  isVeg: boolean;
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'RATE' | 'MY_REVIEWS'>('ORDERS');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [dishes, setDishes] = useState<DishOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Review Form State
  const [selectedDishId, setSelectedDishId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/customer/dashboard');
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setOrders(data.orders || []);
        setReviews(data.reviews || []);
        setDishes(data.dishes || []);
        if (data.dishes && data.dishes.length > 0 && !selectedDishId) {
          setSelectedDishId(data.dishes[0].id);
        }
      } else {
        router.push('/menu');
      }
    } catch (err) {
      console.error('Customer dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/menu');
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDishId) return;

    setIsSubmittingReview(true);
    setReviewMessage('');
    setReviewError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishId: selectedDishId,
          rating,
          comment,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReviewMessage('⭐ Review submitted successfully to Supabase database!');
        setComment('');
        fetchDashboardData();
        setTimeout(() => setReviewMessage(''), 3500);
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch {
      setReviewError('Failed to connect to server');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) =>
    ['CONFIRMED', 'PREPARING', 'READY', 'AWAITING_CASH_VERIFICATION'].includes(o.status)
  );
  const pastOrders = orders.filter((o) => ['COMPLETED', 'CANCELLED'].includes(o.status));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Customer Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 px-4 sm:px-6 sticky top-0 z-30 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-50">{user?.name}</h1>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  CUSTOMER PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold gap-1 shadow-lg">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>My Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RATE')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'RATE'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
            <span>Rate Dishes</span>
          </button>

          <button
            onClick={() => setActiveTab('MY_REVIEWS')}
            className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'MY_REVIEWS'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>My Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* TAB 1: MY ORDERS (Active + Past History) */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-6">
            {/* Active Live Orders Section */}
            {activeOrders.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                    Active Live Orders ({activeOrders.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeOrders.map((ord) => (
                    <motion.div
                      key={ord.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 border border-amber-500/40 p-5 rounded-3xl space-y-4 shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xl font-black text-amber-400 font-mono">
                            {ord.orderNumber || ord.tempRef}
                          </span>
                          <div className="text-xs text-slate-400 font-semibold mt-0.5">
                            {ord.orderType} {ord.tableNumber ? `• Table #${ord.tableNumber}` : ''}
                          </div>
                        </div>

                        <span className="text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full animate-pulse uppercase">
                          {ord.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                        {ord.items.map((it) => (
                          <div key={it.id} className="flex justify-between items-center text-slate-200">
                            <span>
                              <strong className="text-amber-400">{it.quantity}x</strong> {it.dish.name}
                            </span>
                            <span className="font-semibold text-slate-400">₹{it.priceAtOrder * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <Link
                          href={`/order/${ord.id}`}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <span>Track Live Status</span>
                          <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                        </Link>
                        <span className="text-sm font-black text-slate-100">Total: ₹{ord.totalAmount}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Order History Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Order History ({pastOrders.length})
              </h3>

              {pastOrders.length === 0 ? (
                <div className="py-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-2">
                  <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No past completed orders found in database</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pastOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-amber-400 text-base font-mono mr-2">
                            {ord.orderNumber || ord.tempRef}
                          </span>
                          <span className="text-slate-400">
                            {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                            {new Date(ord.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                          {ord.status}
                        </span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs space-y-1.5">
                        {ord.items.map((it) => (
                          <div key={it.id} className="flex justify-between items-center text-slate-300">
                            <span>
                              {it.quantity}x {it.dish.name} {it.portion ? `(${it.portion})` : ''}
                            </span>
                            <span className="font-semibold text-slate-400">₹{it.priceAtOrder * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-slate-400">Payment: {ord.paymentMethod}</span>
                        <span className="text-base font-black text-slate-100">Total: ₹{ord.totalAmount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RATE DISHES FORM */}
        {activeTab === 'RATE' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-50">Rate & Review Menu Dishes</h3>
              <p className="text-xs text-slate-400">Select any dish from the database to rate & post your feedback</p>
            </div>

            {reviewMessage && (
              <div className="p-3.5 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{reviewMessage}</span>
              </div>
            )}

            {reviewError && (
              <div className="p-3.5 bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <form onSubmit={handlePostReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Dish to Rate
                </label>
                <select
                  value={selectedDishId}
                  onChange={(e) => setSelectedDishId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
                >
                  {dishes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (₹{d.price}) {d.isVeg ? '🥬 Veg' : '🍗 Non-Veg'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                  Your Rating
                </label>
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className="p-2 transform transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= rating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Review Comment (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your dining experience with this dish..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>{isSubmittingReview ? 'Submitting...' : 'Submit Rating to Supabase DB ⭐'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: MY REVIEWS LIST */}
        {activeTab === 'MY_REVIEWS' && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              My Submitted Reviews ({reviews.length})
            </h3>

            {reviews.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-2">
                <Star className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">You have not submitted any dish reviews yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden relative shrink-0 border border-slate-800">
                        <Image
                          src={rev.dish.imageUrl}
                          alt={rev.dish.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100">{rev.dish.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              className={`w-3.5 h-3.5 ${
                                st <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {rev.comment && (
                      <p className="text-xs text-slate-300 italic bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                        "{rev.comment}"
                      </p>
                    )}

                    <div className="text-[10px] text-slate-500 text-right">
                      Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
