"use client";

import { create } from "zustand";
import { supabase, USE_MOCK } from "@/lib/supabase";
import type { RolUsuario } from "@/types/database";

/** Campos que seleccionamos de la tabla usuarios */
interface UsuarioSelect {
  id: string;
  negocio_id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

interface AuthUser {
  id: string;
  auth_uid: string;
  negocio_id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
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
      // ── Login por PIN (via API route con service role) ──
      if (email.startsWith("pin:")) {
        const pin = email.replace("pin:", "");

        const res = await fetch("/api/auth/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });

        const data = await res.json();

        if (!res.ok || !data.access_token) {
          set({ error: data.error ?? "PIN inválido", isLoading: false });
          return false;
        }

        // Establecer sesión Auth real en el cliente Supabase
        const { data: sessionData, error: sessionError } = await supabase!.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) {
          set({ error: "Error estableciendo sesión", isLoading: false });
          return false;
        }

        // auth_uid y email vienen de la sesión Auth, no del response
        const authUid = sessionData.session?.user?.id ?? "";
        const authEmail = sessionData.session?.user?.email ?? "";

        set({
          user: {
            id: data.user.id,
            auth_uid: authUid,
            negocio_id: data.user.negocio_id,
            nombre: data.user.nombre,
            email: authEmail,
            rol: data.user.rol as RolUsuario,
          },
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      }

      // ── Login por email/password (Supabase Auth) ──
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
        .from("usuarios")
        .select("id, negocio_id, nombre, email, rol")
        .eq("auth_uid", authData.user.id)
        .eq("activo", true)
        .is("eliminado_en", null)
        .single<UsuarioSelect>();

      if (userError || !usuario) {
        set({
          error: "Usuario no encontrado o desactivado. Contacta al administrador.",
          isLoading: false,
        });
        await supabase!.auth.signOut();
        return false;
      }

      set({
        user: {
          id: usuario.id,
          auth_uid: authData.user.id,
          negocio_id: usuario.negocio_id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
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

    // Si ya hay usuario por PIN login (sin sesión Auth), mantener
    const current = get();
    if (current.isAuthenticated && current.user) {
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
        .from("usuarios")
        .select("id, negocio_id, nombre, email, rol")
        .eq("auth_uid", session.user.id)
        .eq("activo", true)
        .is("eliminado_en", null)
        .single<UsuarioSelect>();

      if (!usuario) {
        await supabase!.auth.signOut();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: {
          id: usuario.id,
          auth_uid: session.user.id,
          negocio_id: usuario.negocio_id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
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
