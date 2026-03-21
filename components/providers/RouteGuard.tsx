"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import type { RolUsuario } from "@/types/database";

/* Role-based access: which roles can see which routes */
const ROLE_ACCESS: Record<string, RolUsuario[]> = {
  "/": ["admin", "camarero", "barista", "cocina"],
  "/dashboard": ["admin", "camarero", "barista", "cocina"],
  "/mesas": ["admin", "camarero", "barista"],
  "/ordenes": ["admin", "camarero", "barista"],
  "/menu": ["admin"],
  "/kds": ["admin", "cocina"],
  "/cobros": ["admin", "camarero", "barista"],
  "/caja": ["admin"],
  "/reportes": ["admin"],
  "/usuarios": ["admin"],
  "/fidelidad": ["admin", "camarero"],
  "/configuracion": ["admin"],
};

const ROLE_HOME: Record<RolUsuario, string> = {
  admin: "/dashboard",
  camarero: "/dashboard",
  barista: "/dashboard",
  cocina: "/kds",
};

/**
 * Protege rutas a nivel de página.
 * Si un usuario navega directo a una ruta sin permiso, redirige a su home.
 */
export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return; // dev mode sin Supabase → permitir todo

    // Buscar la ruta base (ej: /ordenes de /ordenes?mesa=3)
    const routeBase = "/" + (pathname.split("/")[1] ?? "");
    const allowed = ROLE_ACCESS[routeBase];

    if (allowed && !allowed.includes(user.rol)) {
      const home = ROLE_HOME[user.rol] ?? "/";
      router.replace(home);
    }
  }, [pathname, user, router]);

  return <>{children}</>;
}
