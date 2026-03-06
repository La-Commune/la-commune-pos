"use client";

import { create } from "zustand";
import type { Orden, ItemOrden } from "@/lib/validators";

interface OrdenesState {
  ordenes: Orden[];
  currentOrder: Orden | null;
  cart: ItemOrden[];
  setOrdenes: (ordenes: Orden[]) => void;
  setCurrentOrder: (orden: Orden | null) => void;
  addToCart: (item: ItemOrden) => void;
  removeFromCart: (productoId: string) => void;
  updateCartItem: (productoId: string, updates: Partial<ItemOrden>) => void;
  clearCart: () => void;
}

export const useOrdenesStore = create<OrdenesState>((set) => ({
  ordenes: [],
  currentOrder: null,
  cart: [],
  setOrdenes: (ordenes) => set({ ordenes }),
  setCurrentOrder: (orden) => set({ currentOrder: orden }),
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(
        (i) => i.producto_id === item.producto_id && i.tamano === item.tamano
      );
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.producto_id === item.producto_id && i.tamano === item.tamano
              ? { ...i, cantidad: i.cantidad + item.cantidad }
              : i
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),
  removeFromCart: (productoId) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.producto_id !== productoId),
    })),
  updateCartItem: (productoId, updates) =>
    set((state) => ({
      cart: state.cart.map((i) =>
        i.producto_id === productoId ? { ...i, ...updates } : i
      ),
    })),
  clearCart: () => set({ cart: [] }),
}));
