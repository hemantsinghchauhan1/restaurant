'use client';

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Utensils, Leaf, ArrowRight, Loader2, User, Clock, LogOut, X, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { DishCard, DishItem } from '@/components/customer/DishCard';
import { CustomerAuthModal } from '@/components/customer/CustomerAuthModal';

import { UserButton, useClerk, useUser } from '@clerk/nextjs';

import { SkeletonDishCard } from '@/components/ui/Skeleton';
import { FlyingDishAnimation, FlyingItem } from '@/components/customer/FlyingDishAnimation';
import { filterAndRankDishes } from '@/lib/search';

// Dynamically lazy-load CartDrawer to reduce initial JS bundle size & latency
const CartDrawer = dynamic(() => import('@/components/customer/CartDrawer').then((mod) => mod.CartDrawer), {
  ssr: false,
});

interface CategoryWithDishes {
  id: string;
  name: string;
  icon: string;
  sortOrder: number;
  dishes: DishItem[];
}

const ITEMS_PER_PAGE = 12;

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');

  const { tableNumber, setTableNumber, totalItemsCount, totalAmount, sessionId, activeOrderId } = useCart();

  const [categories, setCategories] = useState<CategoryWithDishes[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnlyFilter, setVegOnlyFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [activeQueueCount, setActiveQueueCount] = useState(0);

  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const { signOut } = useClerk();
  const { isSignedIn: isClerkSignedIn, user: clerkUser } = useUser();
  const isLoggedIn = isClerkSignedIn || Boolean(currentUser);
  const userName = clerkUser?.fullName || clerkUser?.firstName || currentUser?.name;

  const handleLogout = async () => {
    try {
      if (isClerkSignedIn) {
        await signOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setCurrentUser(null);
      window.location.reload();
    }
  };

  const handleRoleRedirect = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        const role = data.user.role;
        if (role === 'ADMIN') router.push('/admin/dashboard');
        else if (role === 'MANAGER') router.push('/manager/dashboard');
        else if (role === 'CHEF') router.push('/kitchen/dashboard');
        else router.push('/customer/dashboard');
      } else {
        router.push('/customer/dashboard');
      }
    } catch {
      router.push('/customer/dashboard');
    }
  };
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [cartBounce, setCartBounce] = useState(false);

  const observerTargetRef = useRef<HTMLDivElement>(null);

  const handleAddToCartAnimation = (e: React.MouseEvent, imageUrl: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newItem: FlyingItem = {
      id: `${Date.now()}_${Math.random()}`,
      startPos: { x: rect.left + rect.width / 2, y: rect.top },
      imageUrl,
    };
    setFlyingItems((prev) => [...prev, newItem]);
  };

  const handleFlyingComplete = (id: string) => {
    setFlyingItems((prev) => prev.filter((i) => i.id !== id));
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 350);
  };

  const checkUserAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (res.ok && data.authenticated && data.user) {
        setCurrentUser(data.user);
        fetchCustomerHistory();
      }
    } catch {
      // Guest
    }
  };

  const fetchCustomerHistory = async () => {
    try {
      const res = await fetch('/api/orders/history');
      const data = await res.json();
      if (res.ok && data.orders) {
        setCustomerOrders(data.orders);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkUserAuth();
  }, []);

  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
    }
  }, [tableParam, setTableNumber]);

  const fetchMenu = async () => {
    try {
      const url = sessionId ? `/api/menu?sessionId=${encodeURIComponent(sessionId)}` : '/api/menu';
      const res = await fetch(url);
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
      if (typeof data.activeQueueCount === 'number') {
        setActiveQueueCount(data.activeQueueCount);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();

    // Background sync only when window is active
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMenu();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const [activeOrderDetails, setActiveOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (!activeOrderId) {
      setActiveOrderDetails(null);
      return;
    }

    const fetchActiveOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${activeOrderId}`);
        const data = await res.json();
        if (res.ok && data.order && data.order.status !== 'COMPLETED' && data.order.status !== 'CANCELLED') {
          setActiveOrderDetails(data.order);
        } else {
          setActiveOrderDetails(null);
          try { localStorage.removeItem('restaurant_last_order_id'); } catch {}
        }
      } catch {
        // ignore
      }
    };

    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 4000);
    return () => clearInterval(interval);
  }, [activeOrderId]);

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'price_asc' | 'price_desc' | 'rating_desc'>('recommended');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Debounce search query by 250ms for instant-as-you-type UX
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync search state with URL query parameters for shareability
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');

    if (vegOnlyFilter) params.set('veg', 'true');
    else params.delete('veg');

    if (selectedCatId !== 'ALL') params.set('category', selectedCatId);
    else params.delete('category');

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [searchQuery, vegOnlyFilter, selectedCatId]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [selectedCatId, debouncedQuery, vegOnlyFilter, inStockOnly, sortBy]);

  // Filtered & Ranked dishes using typo-tolerant fuzzy search engine
  const allDishes = useMemo(() => {
    let rawList: (DishItem & { categoryName?: string })[] = [];
    categories.forEach((cat) => {
      cat.dishes.forEach((d) => {
        rawList.push({ ...d, categoryName: cat.name });
      });
    });

    return filterAndRankDishes(rawList, {
      query: debouncedQuery,
      categoryIds: selectedCatId === 'ALL' ? [] : [selectedCatId],
      isVeg: vegOnlyFilter ? true : null,
      inStockOnly,
      sortBy,
    });
  }, [categories, selectedCatId, debouncedQuery, vegOnlyFilter, inStockOnly, sortBy]);

  // Lazy loaded slice of dishes
  const displayedDishes = useMemo(() => {
    return allDishes.slice(0, visibleCount);
  }, [allDishes, visibleCount]);

  const hasMore = visibleCount < allDishes.length;

  // Infinite Scroll Observer for Lazy Loading
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 p-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase block">
              JOHN RESTAURANT
            </span>
            <h1 className="text-xl font-black text-slate-50">
              Menu
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {tableNumber && (
                <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                  Table #{tableNumber}
                </span>
              )}
              <span className="text-[11px] bg-slate-900/90 border border-slate-800 text-slate-300 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Kitchen Live: <strong className="text-amber-400">{activeQueueCount}</strong> {activeQueueCount === 1 ? 'Order' : 'Orders'} Ahead</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 pl-3 rounded-2xl shadow-md">
                <button
                  onClick={handleRoleRedirect}
                  className="text-xs font-bold text-slate-200 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
                  title={`Logged in as ${userName || 'User'}`}
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>{userName ? userName.split(' ')[0] : 'Account'}</span>
                </button>

                <div className="h-4 w-px bg-slate-800 my-auto mx-1" />

                <button
                  onClick={handleRoleRedirect}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl flex items-center gap-1 text-[11px] font-black transition-all"
                  title="Open My Customer Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <div className="h-4 w-px bg-slate-800 my-auto mx-1" />

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-xl transition-all flex items-center gap-1 text-[11px] font-bold"
                  title="Log Out of Account"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-slate-200 flex items-center gap-1.5 text-xs font-bold transition-all shadow-md"
              >
                <User className="w-4 h-4 text-amber-400" />
                <span>Account</span>
              </button>
            )}

            <motion.button
              animate={{ scale: cartBounce ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 hover:border-amber-500/40 transition-all shadow-md"
            >
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {totalItemsCount > 0 && (
                <motion.span
                  key={totalItemsCount}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-xs w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-lg"
                >
                  {totalItemsCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Flying Dish Parabolic Animation Overlay */}
      <FlyingDishAnimation items={flyingItems} onItemComplete={handleFlyingComplete} />

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        {/* Active Live Order Compact Status Banner */}
        {activeOrderDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/50 hover:border-amber-400 rounded-3xl shadow-2xl space-y-3 relative overflow-hidden transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black shrink-0 shadow-lg shadow-amber-500/30">
                  <Utensils className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-50 font-mono">
                      {activeOrderDetails.orderNumber || activeOrderDetails.tempRef || 'Active Order'}
                    </span>
                    <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>{activeOrderDetails.status}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Estimated Wait: <strong className="text-amber-400 font-extrabold">~{activeOrderDetails.estimatedWaitMinutes || 12} Mins</strong> • {activeOrderDetails.items?.length || 1} {activeOrderDetails.items?.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <Link
                href={`/order/${activeOrderId}`}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shrink-0 flex items-center gap-1 shadow-md transition-all group"
              >
                <span>Track</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
              </Link>
            </div>

            {/* Mini Progress Bar Line */}
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500"
                style={{
                  width:
                    activeOrderDetails.status === 'CONFIRMED'
                      ? '30%'
                      : activeOrderDetails.status === 'PREPARING'
                      ? '65%'
                      : activeOrderDetails.status === 'READY'
                      ? '92%'
                      : '20%',
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Search & Combinable Filters Bar */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search dishes (e.g. Paneer, Biryani, Spicy, Rolls)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin absolute right-3.5 top-3.5" />
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            <button
              onClick={() => setVegOnlyFilter(!vegOnlyFilter)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                vegOnlyFilter
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Veg</span>
            </button>
          </div>

          {/* Secondary Sorting & In-Stock Controls */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-medium text-slate-500">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500/40"
              >
                <option value="recommended">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rated</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-slate-700 text-amber-500 focus:ring-0 accent-amber-500"
              />
              <span>In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Categories Horizontal Slider */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
              selectedCatId === 'ALL'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                selectedCatId === cat.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.name} ({cat.dishes.length})
            </button>
          ))}
        </div>

        {/* Dishes List / Grid */}
        {isLoading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonDishCard key={i} />
            ))}
          </div>
        ) : allDishes.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-300">
              No dishes found for "{debouncedQuery || 'selected filters'}"
            </h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try searching with another word or clear your filters to view all menu items.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCatId('ALL');
                setVegOnlyFilter(false);
                setInStockOnly(false);
                setSortBy('recommended');
              }}
              className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all inline-flex items-center gap-1.5 mt-2"
            >
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {displayedDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  onAddToCartAnimation={handleAddToCartAnimation}
                />
              ))}
            </div>

            {/* Lazy Load Sentinel Trigger */}
            {hasMore && (
              <div ref={observerTargetRef} className="py-6 text-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                  className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-xs font-bold text-slate-300 hover:text-amber-400 flex items-center gap-2 mx-auto transition-all"
                >
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Loading More Dishes ({allDishes.length - displayedDishes.length} remaining)...</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Bar */}
      <AnimatePresence>
        {totalItemsCount > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-5 rounded-2xl shadow-2xl shadow-amber-500/40 flex items-center justify-between border border-amber-400/50 transition-all transform active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-slate-950 text-amber-400 font-extrabold text-xs flex items-center justify-center">
                  {totalItemsCount}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">View Cart</div>
                  <div className="text-base font-extrabold text-slate-950">₹{totalAmount}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider">
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      {isCartOpen && <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => checkUserAuth()}
      />

      {/* Customer Order History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-4 shadow-2xl max-h-[85vh] flex flex-col justify-between"
            >
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 bg-slate-950 rounded-full border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-400" />
                  <h2 className="text-xl font-black text-slate-50">My Order History</h2>
                </div>
                <p className="text-xs text-slate-400">
                  Logged in as <strong className="text-amber-400">{currentUser?.name}</strong> ({currentUser?.email})
                </p>
              </div>

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/80">
                {customerOrders.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Utensils className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">No past orders found linked to your account</p>
                  </div>
                ) : (
                  customerOrders.map((ord) => (
                    <div key={ord.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-amber-400 text-sm mr-2">
                            {ord.orderNumber || ord.tempRef}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-xs font-bold bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-300">
                          {ord.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 text-xs space-y-1">
                        {ord.items.map((it: any) => (
                          <div key={it.id} className="flex items-center justify-between text-slate-300">
                            <span>{it.quantity}x {it.dish.name} {it.portion ? `(${it.portion})` : ''}</span>
                            <span className="font-semibold text-slate-400">₹{it.priceAtOrder * it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <Link
                          href={`/order/${ord.id}`}
                          onClick={() => setShowHistoryModal(false)}
                          className="text-amber-400 hover:underline font-bold text-[11px] flex items-center gap-1"
                        >
                          <span>Track Order Status</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                        <span className="font-extrabold text-slate-100 text-sm">Total: ₹{ord.totalAmount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    setCurrentUser(null);
                    setCustomerOrders([]);
                    setShowHistoryModal(false);
                  }}
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-rose-400 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading menu...</div>}>
      <MenuContent />
    </Suspense>
  );
}
