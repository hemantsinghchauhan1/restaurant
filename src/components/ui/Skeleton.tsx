'use client';

import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-900/80 rounded-2xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-800/60 before:to-transparent ${className}`}
    />
  );
}

export function SkeletonDishCard() {
  return (
    <div className="flex flex-col sm:flex-row bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl p-4 gap-4">
      <Skeleton className="w-full sm:w-44 h-44 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-3 py-1">
        <Skeleton className="h-6 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-4 w-5/6 rounded-md" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
          <Skeleton className="h-7 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonOrderTicket() {
  return (
    <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-3xl space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-7 w-32 rounded-xl" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2 py-2">
        <Skeleton className="h-10 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
    </div>
  );
}
