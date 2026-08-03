'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWithRedirectCallback, useUser } from '@clerk/nextjs';

export default function SSOCallbackPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Check database assigned role for dynamic auto-redirection
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            const role = data.user.role;
            if (role === 'ADMIN') {
              router.push('/admin/dashboard');
            } else if (role === 'MANAGER') {
              router.push('/manager/dashboard');
            } else if (role === 'CHEF') {
              router.push('/kitchen/dashboard');
            } else {
              router.push('/customer/dashboard');
            }
          } else {
            router.push('/customer/dashboard');
          }
        })
        .catch(() => {
          router.push('/customer/dashboard');
        });
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
          Verifying Role & Redirecting to your Dashboard...
        </p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
