import { supabase } from "@/lib/supabase";

/**
 * Fetch wrapper que agrega automáticamente el JWT de Supabase Auth
 * al header Authorization. Usar para todas las llamadas a API routes protegidas.
 *
 * Uso:
 *   const res = await authFetch("/api/usuarios", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify(data),
 *   });
 */
export async function authFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  }

  return fetch(url, { ...init, headers });
}
