'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus, Utensils, ShoppingBag as BagIcon, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { PaymentModal } from './PaymentModal';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const {
    cart,
    tableNumber,
    setTableNumber,
    orderType,
    setOrderType,
    updateQuantity,
    updateItemNotes,
    removeFromCart,
    totalAmount,
    totalItemsCount,
    sessionId,
    setActiveOrderId,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'CASH'>('ONLINE');
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    fetch('/api/manager/settings/online-payment')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.onlinePaymentEnabled === false) {
          setOnlinePaymentEnabled(false);
          setPaymentMethod('CASH');
        } else {
          setOnlinePaymentEnabled(true);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProceedToPayment = () => {
    setErrorMsg('');

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty');
      return;
    }

    if (paymentMethod === 'ONLINE') {
      setShowPaymentModal(true);
    } else {
      // Direct Cash Order Submission
      submitOrder('CASH');
    }
  };

  const submitOrder = async (payMethod: 'ONLINE' | 'CASH') => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({
            dishId: i.dishId,
            quantity: i.quantity,
            portion: i.portion || 'FULL',
            notes: i.notes || null,
          })),
          orderType,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : null,
          paymentMethod: payMethod,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Retain active order ID in localStorage & state
      setActiveOrderId(data.order.id);

      // Clear drawer & redirect to tracking page
      onClose();
      setShowPaymentModal(false);
      router.push(`/order/${data.order.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to place order';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="absolute inset-x-0 bottom-0 md:right-0 md:left-auto md:top-0 md:bottom-0 md:h-full max-h-[92vh] md:max-h-full md:w-[480px] flex flex-col bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 rounded-t-3xl md:rounded-t-none md:rounded-l-3xl shadow-2xl overflow-hidden mx-auto md:mx-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Your Cart</h2>
                  <p className="text-xs text-slate-400">{totalItemsCount} item(s) selected</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 px-6 space-y-6">
              {errorMsg && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Order Type Toggle (Dine-in / Takeaway) */}
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex gap-2">
                <button
                  onClick={() => setOrderType('DINE_IN')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    orderType === 'DINE_IN'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>Dine-In</span>
                </button>
                <button
                  onClick={() => setOrderType('TAKEAWAY')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    orderType === 'TAKEAWAY'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BagIcon className="w-4 h-4" />
                  <span>Takeaway</span>
                </button>
              </div>

              {/* Dine-in Table Number Selection (Optional) */}
              {orderType === 'DINE_IN' && (
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                      Table Number (Optional)
                    </label>
                    <p className="text-xs text-slate-500">Table number if seated</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-medium">Table #</span>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      placeholder="Optional"
                      className="w-20 bg-slate-900 border border-amber-500/40 focus:border-amber-400 rounded-xl py-1.5 px-2 text-center font-bold text-amber-400 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Items in Order
                </span>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm">Cart is empty</div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.cartKey}
                      className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-slate-200 truncate">{item.name}</h4>
                            {item.portion && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                                {item.portion}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-amber-400">₹{item.price}</span>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl">
                          <button
                            onClick={() => updateQuantity(item.cartKey, -1)}
                            className="p-1 text-slate-400 hover:text-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-extrabold text-slate-100 w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.cartKey, 1)}
                            className="p-1 text-amber-400 hover:text-amber-300"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Customization note input */}
                      <input
                        type="text"
                        placeholder="Add note (e.g. no onions, extra spicy)..."
                        value={item.notes || ''}
                        onChange={(e) => updateItemNotes(item.cartKey, e.target.value)}
                        className="w-full bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Payment Method
                </span>

                {!onlinePaymentEnabled && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-xs flex items-center gap-2 font-medium shadow-md">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Online UPI payment is temporarily paused by Floor Manager. Please pay with Cash at your table or counter.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!onlinePaymentEnabled}
                    onClick={() => onlinePaymentEnabled && setPaymentMethod('ONLINE')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      !onlinePaymentEnabled
                        ? 'opacity-40 grayscale cursor-not-allowed bg-slate-950/40 border-slate-800 text-slate-600'
                        : paymentMethod === 'ONLINE'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Pay Online (UPI / Card)</span>
                    <span className="text-[10px] text-slate-400">
                      {onlinePaymentEnabled ? 'Instant Order Confirmation' : 'Disabled by Manager'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm">Pay Cash at Counter</span>
                    <span className="text-[10px] text-slate-400">Verify reference with Staff</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Total & Place Order Button */}
            <div className="p-4 px-6 border-t border-slate-800 bg-slate-950/90 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm font-medium">Total Amount</span>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-sm font-bold text-amber-400">₹</span>
                  <span className="text-2xl font-black text-slate-100">{totalAmount}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 text-sm tracking-wide uppercase flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <span>Placing Order...</span>
                ) : (
                  <span>{paymentMethod === 'ONLINE' ? 'Pay & Confirm Order' : 'Place Cash Order'}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Razorpay Online Payment Simulator Modal */}
      {showPaymentModal && (
        <PaymentModal
          amount={totalAmount}
          onSuccess={() => submitOrder('ONLINE')}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}
