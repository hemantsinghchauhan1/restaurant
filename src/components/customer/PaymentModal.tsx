'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CreditCard, QrCode, CheckCircle2, Lock, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaymentModal({ amount, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<'UPI' | 'CARD'>('UPI');
  const [upiId, setUpiId] = useState('user@upi');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8912');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  const handleSimulatePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsPaidSuccess(true);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        onSuccess();
      }, 1200);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Top Branding Banner */}
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold tracking-wide text-blue-400">RAZORPAY</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                    SECURE GATEWAY
                  </span>
                </div>
                <p className="text-xs text-slate-400">256-Bit Encrypted Checkout</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Body */}
          <div className="p-6 space-y-5">
            {isPaidSuccess ? (
              <div className="py-8 text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </motion.div>
                <h3 className="text-xl font-extrabold text-slate-100">Payment Successful!</h3>
                <p className="text-xs text-slate-400">Verified ₹{amount} transaction. Confirming order...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400">Payable Amount</span>
                  <span className="text-2xl font-black text-amber-400">₹{amount}</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setMethod('UPI')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      method === 'UPI' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI / GPay</span>
                  </button>
                  <button
                    onClick={() => setMethod('CARD')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      method === 'CARD' ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Debit / Credit Card</span>
                  </button>
                </div>

                {/* Method Input */}
                {method === 'UPI' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 block">VPA / UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 block">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}

                <button
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing Security Verification...' : `Pay ₹${amount} Now`}</span>
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
