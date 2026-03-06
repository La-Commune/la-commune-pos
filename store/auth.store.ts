"use client";

import { create } from "zustand";
import type { RolUsuario } from "@/lib/validators";
import { z } from "zod";

type Rol = z.infer<typeof import("@/lib/validators").RolUsuario>;

interface AuthUser {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  logout: () => set({ user: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
