import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type AuthResult =
  | { ok: true; userId: string; rol: string; negocioId: string }
  | { ok: false; response: NextResponse };

/**
 * Verifica el JWT del header Authorization en API routes.
 * Extrae el usuario de Supabase Auth y busca su rol en la tabla usuarios.
 *
 * Uso:
 *   const auth = await verifyApiAuth(request);
 *   if (!auth.ok) return auth.response;
 *   // auth.userId y auth.rol disponibles
 */
export async function verifyApiAuth(
  request: Request,
  requiredRoles?: string[]
): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado — falta token" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "");

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Configuración de Supabase incompleta" },
        { status: 500 }
      ),
    };
  }

  // Crear cliente con el JWT del usuario para verificar autenticidad
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      ),
    };
  }

  // Buscar rol y negocio del usuario en la tabla usuarios
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol, negocio_id")
    .eq("auth_uid", user.id)
    .eq("activo", true)
    .is("eliminado_en", null)
    .single();

  const rol = usuario?.rol ?? "unknown";
  const negocioId = usuario?.negocio_id ?? "";

  // Verificar rol si se requiere
  if (requiredRoles && !requiredRoles.includes(rol)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Permisos insuficientes" },
        { status: 403 }
      ),
    };
  }

  return { ok: true, userId: user.id, rol, negocioId };
}
