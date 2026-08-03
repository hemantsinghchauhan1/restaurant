'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Plus, Minus, Clock, Leaf, Drumstick, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { DishRatingModal } from './DishRatingModal';

export interface DishItem {
  id: string;
  name: string;
  description: string;
  price: number;        // Full price
  priceHalf?: number | null; // Half price
  imageUrl: string;
  isVeg: boolean;
  inStock: boolean;
  prepTimeMinutes: number;
}

export function DishCard({
  dish,
  onAddToCartAnimation,
}: {
  dish: DishItem;
  onAddToCartAnimation?: (e: React.MouseEvent, imageUrl: string) => void;
}) {
  const { cart, addToCart, updateQuantity } = useCart();
  const [selectedPortion, setSelectedPortion] = useState<'FULL' | 'HALF'>('FULL');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsLoggedIn(true);
        }
      })
      .catch(() => {});
  }, []);

  const currentPrice = selectedPortion === 'HALF' && dish.priceHalf ? dish.priceHalf : dish.price;
  const currentCartKey = `${dish.id}_${selectedPortion}`;

  const cartItem = cart.find((i) => i.cartKey === currentCartKey);
  const quantity = cartItem?.quantity || 0;

  const handleAddClick = (e: React.MouseEvent) => {
    addToCart({
      dishId: dish.id,
      name: dish.priceHalf ? `${dish.name} (${selectedPortion === 'HALF' ? 'Half' : 'Full'})` : dish.name,
      price: currentPrice,
      imageUrl: dish.imageUrl,
      isVeg: dish.isVeg,
      portion: selectedPortion,
    });
    if (onAddToCartAnimation) {
      onAddToCartAnimation(e, dish.imageUrl);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative flex flex-col sm:flex-row bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 ${
        !dish.inStock
          ? 'opacity-60 grayscale filter transition-all'
          : 'hover:border-amber-500/40 hover:shadow-amber-500/10'
      }`}
    >
      {!dish.inStock && (
        <div className="absolute top-4 -right-10 bg-rose-600/90 text-slate-50 font-black text-[10px] uppercase px-10 py-1 rotate-45 z-20 shadow-lg tracking-widest pointer-events-none">
          OUT OF STOCK
        </div>
      )}
      {/* Dish Image */}
      <div className="relative w-full sm:w-44 h-48 sm:h-auto overflow-hidden shrink-0">
        <Image
          src={dish.imageUrl.replace('w=800&q=80', 'w=400&q=70')}
          alt={dish.name}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 640px) 100vw, 176px"
        />

        {/* Veg / Non-Veg Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 flex items-center gap-1.5 shadow-md">
          {dish.isVeg ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Leaf className="w-1.5 h-1.5 text-slate-950" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">VEG</span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 flex items-center justify-center">
                <Drumstick className="w-1.5 h-1.5 text-slate-950" />
              </div>
              <span className="text-[11px] font-semibold text-rose-400">NON-VEG</span>
            </>
          )}
        </div>

        {/* Prep Time Badge */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-300 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>{dish.prepTimeMinutes} mins</span>
        </div>
      </div>

      {/* Dish Details */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-slate-100 line-clamp-1 group-hover:text-amber-400 transition-colors">
              {dish.name}
            </h3>
            <button
              onClick={() => setShowRatingModal(true)}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-amber-400 flex items-center gap-1 text-[11px] font-bold shrink-0 transition-all active:scale-95 shadow-sm"
              title="Rate & Review Dish"
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Rate</span>
            </button>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
            {dish.description}
          </p>

          {/* Half / Full Portion Selector */}
          {dish.priceHalf && dish.inStock && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-slate-400 font-medium">Portion:</span>
              <div className="inline-flex p-1 bg-slate-950/80 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSelectedPortion('HALF')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedPortion === 'HALF'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Half (₹{dish.priceHalf})
                </button>
                <button
                  onClick={() => setSelectedPortion('FULL')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedPortion === 'FULL'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Full (₹{dish.price})
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">
                {dish.priceHalf ? (selectedPortion === 'HALF' ? 'Half:' : 'Full:') : 'Price:'}
              </span>
              <span className="text-sm font-semibold text-amber-400">₹</span>
              <span className="text-xl font-extrabold text-slate-50">{currentPrice}</span>
            </div>
            {dish.priceHalf && (
              <span className="text-[11px] font-bold text-amber-400/80 mt-0.5">
                (Full ₹{dish.price} / Half ₹{dish.priceHalf})
              </span>
            )}
          </div>

          {/* Action Button / Quantity Controls */}
          {!dish.inStock ? (
            <span className="text-xs font-semibold text-rose-400 bg-rose-950/50 border border-rose-800/50 px-3 py-1.5 rounded-xl">
              Out of Stock
            </span>
          ) : quantity === 0 ? (
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={(e) => handleAddClick(e)}
              className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>ADD</span>
            </motion.button>
          ) : (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => updateQuantity(currentCartKey, -1)}
                className="w-7 h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 flex items-center justify-center text-amber-400 font-bold"
              >
                <Minus className="w-3.5 h-3.5" />
              </motion.button>
              <span className="font-extrabold text-slate-100 text-sm min-w-[1.25rem] text-center">
                {quantity}
              </span>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => updateQuantity(currentCartKey, 1)}
                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )}
        </div>
      </div>

      <DishRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        dishId={dish.id}
        dishName={dish.name}
        isLoggedIn={isLoggedIn}
      />
    </motion.div>
  );
}
