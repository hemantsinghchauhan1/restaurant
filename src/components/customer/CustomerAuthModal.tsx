'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, AlertCircle } from 'lucide-react';
import { SignIn, SignUp, useUser } from '@clerk/nextjs';

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
  const [authMethod, setAuthMethod] = useState<'CLERK' | 'STANDARD'>('CLERK');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isSignedIn } = useUser();

  if (!isOpen) return null;

  // Auto-close if signed in with Clerk
  if (isSignedIn) {
    if (onSuccess) onSuccess();
    onClose();
  }

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
        if (onSuccess) onSuccess();
        onClose();
        window.location.reload();
      } else {
        setError(data.error || 'Authentication failed');
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
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 relative space-y-4 my-auto"
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
              {mode === 'LOGIN' ? 'Customer Sign In' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {noticeMessage || 'Sign in with Clerk or email to track orders & rate dishes'}
            </p>
          </div>

          {/* Authentication Method Selector (Clerk vs Email/Password) */}
          <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold gap-1">
            <button
              onClick={() => setAuthMethod('CLERK')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMethod === 'CLERK'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🔒 Clerk Fast Auth
            </button>
            <button
              onClick={() => setAuthMethod('STANDARD')}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMethod === 'STANDARD'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✉️ Email / Password
            </button>
          </div>

          {authMethod === 'CLERK' ? (
            <div className="flex justify-center py-2 min-h-[350px]">
              {mode === 'LOGIN' ? (
                <SignIn
                  appearance={{
                    elements: {
                      card: 'bg-transparent border-0 shadow-none p-0',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton:
                        'bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800',
                      formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
                      footerActionLink: 'text-amber-400 hover:underline',
                    },
                  }}
                />
              ) : (
                <SignUp
                  appearance={{
                    elements: {
                      card: 'bg-transparent border-0 shadow-none p-0',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton:
                        'bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800',
                      formButtonPrimary: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black',
                      footerActionLink: 'text-amber-400 hover:underline',
                    },
                  }}
                />
              )}
            </div>
          ) : (
            <form onSubmit={handleStandardSubmit} className="space-y-4">
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
                    placeholder="e.g. Rahul Sharma"
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
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
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
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 px-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>{isLoading ? 'Processing...' : mode === 'LOGIN' ? 'Log In Now' : 'Create Account'}</span>
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
              className="text-xs text-slate-400 hover:text-amber-400 font-semibold"
            >
              {mode === 'LOGIN'
                ? "Don't have an account? Sign Up"
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
