'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FlyingItem {
  id: string;
  startPos: { x: number; y: number };
  imageUrl: string;
}

interface FlyingDishAnimationProps {
  items: FlyingItem[];
  onItemComplete: (id: string) => void;
}

export function FlyingDishAnimation({ items, onItemComplete }: FlyingDishAnimationProps) {
  // Target position: top right cart button or bottom cart bar (center bottom)
  const targetX = typeof window !== 'undefined' ? window.innerWidth - 60 : 300;
  const targetY = 30;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{
              x: item.startPos.x,
              y: item.startPos.y,
              scale: 1,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              x: [item.startPos.x, (item.startPos.x + targetX) / 2 + 80, targetX],
              y: [item.startPos.y, Math.min(item.startPos.y, targetY) - 120, targetY],
              scale: [1, 1.2, 0.25],
              opacity: [1, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 0.65,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            onAnimationComplete={() => onItemComplete(item.id)}
            className="absolute w-12 h-12 rounded-full overflow-hidden shadow-2xl border-2 border-amber-400 bg-slate-900"
          >
            <img src={item.imageUrl} alt="Flying item" className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
