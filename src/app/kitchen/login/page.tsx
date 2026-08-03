'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function KitchenLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('chef@restaurant.com');
  const [password, setPassword] = useState('chef123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/kitchen/dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <ChefHat className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-slate-50 tracking-tight">Kitchen Screen Login</h1>
          <p className="text-xs text-slate-400">Chef & Kitchen Staff Order Station</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-2xl">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Kitchen Staff Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Passcode / Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-4 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>{isLoading ? 'Connecting...' : 'Open Kitchen Screen'}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </form>

        <div className="text-center p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl text-[11px] text-slate-500">
          Demo Chef Login: <strong className="text-slate-300">chef@restaurant.com</strong> / <strong className="text-slate-300">chef123</strong>
        </div>
      </div>
    </div>
  );
}
