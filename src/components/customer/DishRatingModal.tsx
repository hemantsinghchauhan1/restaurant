'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { CustomerAuthModal } from './CustomerAuthModal';

interface DishRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishId: string;
  dishName: string;
  isLoggedIn: boolean;
}

export function DishRatingModal({
  isOpen,
  onClose,
  dishId,
  dishName,
  isLoggedIn,
}: DishRatingModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isOpen) return null;

  if (!isLoggedIn) {
    return (
      <CustomerAuthModal
        isOpen={isOpen}
        onClose={onClose}
        initialMode="LOGIN"
        noticeMessage={`Please log in or sign up to rate "${dishName}"`}
      />
    );
  }

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dishId, rating, comment }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Thank you! Your rating has been recorded ⭐');
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit rating');
      }
    } catch {
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 relative space-y-5 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 bg-slate-950 rounded-full border border-slate-800"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
              DISH RATING & REVIEW
            </span>
            <h3 className="text-lg font-black text-slate-50">{dishName}</h3>
            <p className="text-xs text-slate-400">Rate your experience with this dish</p>
          </div>

          {success ? (
            <div className="p-4 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-2xl flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitRating} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Star Rating selector */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2 transform transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Optional Review / Feedback
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell us what you liked about this dish..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all"
              >
                <span>{isLoading ? 'Submitting...' : 'Submit Rating ⭐'}</span>
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
