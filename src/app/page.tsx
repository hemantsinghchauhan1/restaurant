'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { QrCode, Utensils, ArrowRight, ShieldCheck, Clock, ChefHat, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function LandingPage() {
  const { tableNumber, setTableNumber } = useCart();
  const [selectedTable, setSelectedTable] = useState(tableNumber || '5');

  return (
    <main className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header Branding */}
      <div className="pt-6 text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>CONTACTLESS QR DINING</span>
        </motion.div>

        <motion.h1
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-slate-50"
        >
          John<span className="text-amber-500">Restaurant</span>
        </motion.h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
          Scan, order, and pay right from your table — zero app installation or login required.
        </p>
      </div>

      {/* Interactive Table QR Simulator Card */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="my-8 bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 glow-amber"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <QrCode className="w-10 h-10 stroke-[2]" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Table QR Simulator</h2>
          <p className="text-xs text-slate-400">Select your dining table or proceed as Takeaway</p>
        </div>

        {/* Table Selector Dropdown */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
            Select Dining Table
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['1', '2', '5', '8'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTable(t);
                  setTableNumber(t);
                }}
                className={`py-2.5 rounded-xl font-extrabold text-sm border transition-all ${
                  selectedTable === t
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                T-{t}
              </button>
            ))}
          </div>
        </div>

        <Link
          href={`/menu${selectedTable ? `?table=${selectedTable}` : ''}`}
          className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-4 px-6 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 text-base transition-all transform active:scale-95"
        >
          <Utensils className="w-5 h-5 stroke-[2.5]" />
          <span>Explore Menu & Order</span>
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </Link>
      </motion.div>

      {/* Bottom Features List */}
      <div className="grid grid-cols-3 gap-3 text-center pb-6">
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
          <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-[11px] font-bold text-slate-200">No Login</div>
          <div className="text-[9px] text-slate-500">100% Frictionless</div>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
          <Clock className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-[11px] font-bold text-slate-200">Live Status</div>
          <div className="text-[9px] text-slate-500">Real-time Wait</div>
        </div>
        <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl space-y-1">
          <ChefHat className="w-5 h-5 text-amber-400 mx-auto" />
          <div className="text-[11px] font-bold text-slate-200">Fresh Food</div>
          <div className="text-[9px] text-slate-500">Direct to Kitchen</div>
        </div>
      </div>

      {/* Staff Logins Footer */}
      <div className="text-center pt-2 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-500">
        <Link href="/manager/login" className="hover:text-amber-400 transition-colors">
          Manager Portal
        </Link>
        <span>•</span>
        <Link href="/admin/login" className="hover:text-amber-400 transition-colors">
          Admin Control
        </Link>
      </div>
    </main>
  );
}
