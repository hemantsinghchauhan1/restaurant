'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, AlertCircle, CheckCircle2, Lock, Mail, KeyRound } from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'LOGIN' | 'SIGNUP';
  noticeMessage?: string;
}

export function CustomerAuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'LOGIN',
  noticeMessage,
}: CustomerAuthModalProps) {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleFillDemoCustomer = () => {
    setEmail('customer@restaurant.com');
    setPassword('customer123');
    if (mode === 'SIGNUP') {
      setName('Hemant Singh');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'LOGIN' ? '/api/auth/login' : '/api/auth/signup';
      const body =
        mode === 'LOGIN'
          ? { email, password }
          : { name, email, phone, password, role: 'CUSTOMER' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && (data.success || data.authenticated)) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          window.location.href = '/customer/dashboard';
        }, 800);
      } else {
        setError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative space-y-4 my-auto text-slate-100"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 bg-slate-950 rounded-full border border-slate-800 z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-1">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-50">
              {mode === 'LOGIN' ? 'Customer Sign In' : 'Create Customer Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {noticeMessage || 'Sign in to track orders, view past history & rate dishes'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold gap-1">
            <button
              onClick={() => { setMode('LOGIN'); setError(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                mode === 'LOGIN'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('SIGNUP'); setError(''); }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                mode === 'SIGNUP'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Quick Demo Credentials Fill Button */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-bold text-amber-400 block">Demo Customer Credentials:</span>
              <span className="text-[11px] text-slate-300 font-mono">customer@restaurant.com / customer123</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemoCustomer}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded-xl shrink-0 transition-all shadow-md flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Fill</span>
            </button>
          </div>

          {success ? (
            <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {mode === 'SIGNUP' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Hemant Singh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="customer@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {mode === 'SIGNUP' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>{isLoading ? 'Authenticating...' : mode === 'LOGIN' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
