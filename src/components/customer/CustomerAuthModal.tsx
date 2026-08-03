'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User } from 'lucide-react';
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
  const { isSignedIn } = useUser();

  if (!isOpen) return null;

  // Auto-close if signed in with Clerk
  if (isSignedIn) {
    if (onSuccess) onSuccess();
    onClose();
  }

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
              {initialMode === 'LOGIN' ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400">
              {noticeMessage || 'Sign in with Clerk to track live orders & rate dishes'}
            </p>
          </div>

          <div className="flex justify-center py-2 min-h-[320px]">
            {initialMode === 'LOGIN' ? (
              <SignIn
                fallbackRedirectUrl="/sso-callback"
                signUpFallbackRedirectUrl="/sso-callback"
                appearance={{
                  elements: {
                    card: 'bg-transparent border-0 shadow-none p-0 w-full',
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
                fallbackRedirectUrl="/sso-callback"
                signInFallbackRedirectUrl="/sso-callback"
                appearance={{
                  elements: {
                    card: 'bg-transparent border-0 shadow-none p-0 w-full',
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
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
