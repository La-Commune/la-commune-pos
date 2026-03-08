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
  console.warn("[supabase-admin] Faltan SUPABASE_URL o SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Genera el password determinístico para login por PIN.
 * Formato: lc_pos_{auth_uid} — único por usuario, irreversible sin conocer el uid.
 */
export function derivePinPassword(authUid: string): string {
  return `lc_pos_${authUid}`;
}
