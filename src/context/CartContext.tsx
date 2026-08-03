'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  cartKey: string;
  dishId: string;
  name: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  quantity: number;
  portion: 'FULL' | 'HALF';
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  tableNumber: string;
  orderType: 'DINE_IN' | 'TAKEAWAY';
  sessionId: string;
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  setTableNumber: (table: string) => void;
  setOrderType: (type: 'DINE_IN' | 'TAKEAWAY') => void;
  addToCart: (item: Omit<CartItem, 'quantity' | 'cartKey'>) => void;
  updateQuantity: (cartKey: string, delta: number) => void;
  updateItemNotes: (cartKey: string, notes: string) => void;
  removeFromCart: (cartKey: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumberState] = useState<string>('5');
  const [orderType, setOrderTypeState] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [sessionId, setSessionId] = useState<string>('');
  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(null);

  useEffect(() => {
    let existingSession = localStorage.getItem('restaurant_session_id');
    if (!existingSession) {
      existingSession = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      localStorage.setItem('restaurant_session_id', existingSession);
    }
    setSessionId(existingSession);

    const savedCart = localStorage.getItem('restaurant_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        // ignore
      }
    }

    const savedTable = localStorage.getItem('restaurant_table');
    if (savedTable) {
      setTableNumberState(savedTable);
    }

    const savedActiveOrder = localStorage.getItem('restaurant_active_order_id');
    if (savedActiveOrder) {
      setActiveOrderIdState(savedActiveOrder);
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem('restaurant_cart', JSON.stringify(updatedCart));
  };

  const setActiveOrderId = (orderId: string | null) => {
    setActiveOrderIdState(orderId);
    if (orderId) {
      localStorage.setItem('restaurant_active_order_id', orderId);
    } else {
      localStorage.removeItem('restaurant_active_order_id');
    }
  };

  const setTableNumber = (table: string) => {
    setTableNumberState(table);
    localStorage.setItem('restaurant_table', table);
  };

  const setOrderType = (type: 'DINE_IN' | 'TAKEAWAY') => {
    setOrderTypeState(type);
  };

  const addToCart = (item: Omit<CartItem, 'quantity' | 'cartKey'>) => {
    const portion = item.portion || 'FULL';
    const cartKey = `${item.dishId}_${portion}`;
    const existingIndex = cart.findIndex((i) => i.cartKey === cartKey);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      saveCartToStorage(updated);
    } else {
      saveCartToStorage([...cart, { ...item, portion, cartKey, quantity: 1 }]);
    }
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    const existingIndex = cart.findIndex((i) => i.cartKey === cartKey);
    if (existingIndex > -1) {
      const updated = [...cart];
      const newQty = updated[existingIndex].quantity + delta;
      if (newQty <= 0) {
        updated.splice(existingIndex, 1);
      } else {
        updated[existingIndex].quantity = newQty;
      }
      saveCartToStorage(updated);
    }
  };

  const updateItemNotes = (cartKey: string, notes: string) => {
    const updated = cart.map((i) => (i.cartKey === cartKey ? { ...i, notes } : i));
    saveCartToStorage(updated);
  };

  const removeFromCart = (cartKey: string) => {
    const updated = cart.filter((i) => i.cartKey !== cartKey);
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('restaurant_cart');
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        tableNumber,
        orderType,
        sessionId,
        activeOrderId,
        setActiveOrderId,
        setTableNumber,
        setOrderType,
        addToCart,
        updateQuantity,
        updateItemNotes,
        removeFromCart,
        clearCart,
        totalAmount,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
