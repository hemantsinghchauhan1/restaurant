'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed } from 'lucide-react';
import { SignIn } from '@clerk/nextjs';

export default function KitchenLoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-4"
      >
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-1">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-50">Kitchen Order Station</h1>
          <p className="text-xs text-slate-400">Sign in with Clerk to manage live kitchen tickets</p>
        </div>

        <div className="flex justify-center py-2 min-h-[320px]">
          <SignIn
            routing="hash"
            forceRedirectUrl="/sso-callback"
            signUpForceRedirectUrl="/sso-callback"
            appearance={{
              elements: {
                card: 'bg-transparent border-0 shadow-none p-0 w-full',
                headerTitle: 'hidden',
                headerSubtitle: 'hidden',
                socialButtonsBlockButton:
                  'bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800',
                formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
                footerActionLink: 'text-emerald-400 hover:underline',
              },
            }}
          />
        </div>
      </motion.div>
    </main>
  );
}
