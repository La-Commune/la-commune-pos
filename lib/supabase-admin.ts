import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente Supabase con Service Role — SOLO para API Routes (server-side).
 * Bypasea RLS y tiene acceso admin completo.
 * NUNCA importar desde componentes client-side.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  if (process.env.NODE_ENV === "development") {
    console.warn("[supabase-admin] Faltan SUPABASE_URL o SERVICE_ROLE_KEY");
  }
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Genera el password determinístico para login por PIN.
 * Usa HMAC-SHA256 con un secret de entorno para que no sea derivable solo con el uid.
 * Requiere PIN_PASSWORD_SECRET en .env.local (generar con: openssl rand -hex 32)
 */
export function derivePinPassword(authUid: string): string {
  const crypto = require("crypto");
  const secret = process.env.PIN_PASSWORD_SECRET;
  if (!secret) {
    throw new Error("Falta PIN_PASSWORD_SECRET en variables de entorno");
  }
  return crypto.createHmac("sha256", secret).update(authUid).digest("hex");
}
