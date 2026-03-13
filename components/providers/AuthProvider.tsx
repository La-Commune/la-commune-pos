"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { useSW } from "@/hooks/useSW";

const PUBLIC_ROUTES = ["/login"];
const DEV_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkSession } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [show, setShow] = useState(false);

  // Registrar Service Worker y listeners online/offline
  useSW();

  useEffect(() => {
    async function init() {
      if (DEV_MODE) {
        // En modo dev sin Supabase, auto-login con usuario mock
        if (!isAuthenticated) {
          useAuthStore.setState({
            user: {
              id: "dev-user-1",
              auth_uid: "dev-auth-1",
              negocio_id: "dev-negocio-1",
              nombre: "David (Dev)",
              email: "david@lacommune.mx",
              rol: "admin",
            },
            isAuthenticated: true,
            isLoading: false,
          });
        }
        setExiting(true);
        setTimeout(() => {
          setReady(true);
          setShow(true);
        }, 250);
        return;
      }

      try {
        await checkSession();
      } catch (error) {
        console.error("Error verificando sesión:", error);
        useAuthStore.setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        });
      } finally {
        // Animate loading screen out before showing app
        setExiting(true);
        setTimeout(() => {
          setReady(true);
          setShow(true);
        }, 250);
      }
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;

    const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

    if (!isAuthenticated && !isPublic && !DEV_MODE) {
      router.replace("/login");
    }

    if (isAuthenticated && isPublic) {
      router.replace("/");
    }
  }, [ready, isAuthenticated, pathname, router]);

  // Loading state
  if (!ready) {
    return (
      <div
        className={`min-h-screen bg-surface-0 flex items-center justify-center ${exiting ? "auth-loading-exit" : ""}`}
        role="status"
        aria-live="polite"
        aria-label="Cargando aplicación"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-md bg-surface-2 border border-border flex items-center justify-center mx-auto mb-3">
            <span className="font-display text-text-100 text-lg">LC</span>
          </div>
          <p className="text-text-25 text-xs uppercase tracking-widest animate-pulse">
            Cargando...
          </p>
          <p className="text-text-25 text-xs mt-1">
            {DEV_MODE ? "Modo desarrollo" : "Verificando sesión"}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on public route (and not dev mode), don't render
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  if (!isAuthenticated && !isPublic && !DEV_MODE) {
    return null;
  }

  return <>{children}</>;
}
