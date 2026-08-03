'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function MenuSSOCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/menu"
        signUpFallbackRedirectUrl="/menu"
      />
    </div>
  );
}
