'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChefHat, Lock, Mail, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('manager1@restaurant.com');
  const [password, setPassword] = useState('manager123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/manager/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillManager = (mgrEmail: string) => {
    setEmail(mgrEmail);
    setPassword('manager123');
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-50">Manager Portal</h1>
          <p className="text-xs text-slate-400">Live order fulfillment & cash verification</p>
        </div>

        {/* 2 Demo Manager Accounts Fill Options */}
        <div className="space-y-2 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <div className="text-xs font-bold text-amber-400">👔 Select Demo Manager Account:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillManager('manager1@restaurant.com')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs space-y-0.5 transition-all"
            >
              <div className="font-bold text-slate-200 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Manager 1</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">manager1@restaurant.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleFillManager('manager2@restaurant.com')}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs space-y-0.5 transition-all"
            >
              <div className="font-bold text-slate-200 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Manager 2</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">manager2@restaurant.com</div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-sm transition-all"
          >
            <span>{isSubmitting ? 'Authenticating...' : 'Login to Dashboard'}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Need a new manager account?{' '}
          <Link href="/manager/signup" className="text-amber-400 font-bold hover:underline">
            Request Access
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
