import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true cuando las keys de Supabase NO están configuradas */
export const USE_MOCK = !supabaseUrl || !supabaseAnonKey;

// Solo crear el cliente si hay credenciales; si no, exportar un placeholder null.
// Todos los hooks/stores deben checar USE_MOCK antes de usar `supabase`.
export const supabase: SupabaseClient<Database> | null = USE_MOCK
  ? null
  : createClient<Database>(supabaseUrl, supabaseAnonKey);
