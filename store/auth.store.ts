"use client";

import { create } from "zustand";
import { supabase, USE_MOCK } from "@/lib/supabase";

type Rol = "admin" | "barista" | "camarero" | "cocina";

interface AuthUser {
  id: string;
  auth_uid: string;
  negocio_id: string;
  nombre: string;
  email: string;
  rol: Rol;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    if (USE_MOCK || !supabase) {
      set({ error: "Supabase no configurado. Usa modo dev.", isLoading: false });
      return false;
    }

    try {
      // 1. Sign in con Supabase Auth
      const { data: authData, error: authError } = await supabase!.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const msg =
          authError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : authError.message;
        set({ error: msg, isLoading: false });
        return false;
      }

      if (!authData.user) {
        set({ error: "No se pudo autenticar", isLoading: false });
        return false;
      }

      // 2. Obtener datos del usuario en tabla `usuarios`
      const { data: usuario, error: userError } = await supabase!
        .from("usuarios" as any)
        .select("id, negocio_id, nombre, email, rol")
        .eq("auth_uid", authData.user.id)
        .eq("activo", true)
        .is("eliminado_en", null)
        .single();

      if (userError || !usuario) {
        set({
          error: "Usuario no encontrado o desactivado. Contacta al administrador.",
          isLoading: false,
        });
        await supabase!.auth.signOut();
        return false;
      }

      const u = usuario as any;
      set({
        user: {
          id: u.id,
          auth_uid: authData.user.id,
          negocio_id: u.negocio_id,
          nombre: u.nombre,
          email: u.email,
          rol: u.rol as Rol,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch {
      set({ error: "Error de conexión. Intenta de nuevo.", isLoading: false });
      return false;
    }
  },

  logout: async () => {
    if (supabase) await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  checkSession: async () => {
    if (USE_MOCK || !supabase) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const { data: usuario } = await supabase!
        .from("usuarios" as any)
        .select("id, negocio_id, nombre, email, rol")
        .eq("auth_uid", session.user.id)
        .eq("activo", true)
        .is("eliminado_en", null)
        .single();

      if (!usuario) {
        await supabase!.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const u = usuario as any;
      set({
        user: {
          id: u.id,
          auth_uid: session.user.id,
          negocio_id: u.negocio_id,
          nombre: u.nombre,
          email: u.email,
          rol: u.rol as Rol,
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  clearError: () => set({ error: null }),
}));
