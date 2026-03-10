import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Clientes Supabase (server-side only) ──
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function derivePinPassword(authUid: string): string {
  const crypto = require("crypto");
  const secret = process.env.PIN_PASSWORD_SECRET;
  if (!secret) {
    throw new Error("Falta PIN_PASSWORD_SECRET en variables de entorno");
  }
  return crypto.createHmac("sha256", secret).update(authUid).digest("hex");
}

/**
 * POST /api/auth/pin
 * Valida PIN → genera sesión Auth real → retorna tokens
 *
 * Body: { pin: "1012" }
 * Response: { access_token, refresh_token, user: { id, nombre, email, rol, negocio_id } }
 */
export async function POST(request: Request) {
  try {
    // Validar que tenemos las keys
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta en el servidor" },
        { status: 500 },
      );
    }

    // Parsear body
    const body = await request.json().catch(() => null);
    if (!body?.pin || typeof body.pin !== "string" || body.pin.length !== 4) {
      return NextResponse.json(
        { error: "PIN debe ser 4 dígitos" },
        { status: 400 },
      );
    }

    const { pin } = body;

    // 1. Validar PIN con service role (bypasea RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: pinResult, error: pinError } = await supabaseAdmin.rpc(
      "login_por_pin",
      { pin_input: pin },
    );

    if (pinError) {
      console.error("[pin-login] RPC error:", pinError.message);
      return NextResponse.json(
        { error: "Error al verificar PIN" },
        { status: 500 },
      );
    }

    const userData =
      typeof pinResult === "string" ? JSON.parse(pinResult) : pinResult;

    if (!userData?.success) {
      return NextResponse.json(
        { error: userData?.error ?? "PIN inválido" },
        { status: 401 },
      );
    }

    // 2. Obtener email real de Auth (puede diferir del de la tabla usuarios)
    const { data: authUser, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(userData.auth_uid);

    if (authUserError || !authUser?.user?.email) {
      console.error("[pin-login] No se encontró usuario Auth:", authUserError?.message);
      return NextResponse.json(
        { error: "Usuario Auth no encontrado. Contacta al administrador." },
        { status: 500 },
      );
    }

    const authEmail = authUser.user.email;

    // 3. Generar password determinístico y crear sesión Auth real
    const password = derivePinPassword(userData.auth_uid);

    // Usamos un cliente con anon key para signIn (simula lo que haría el frontend)
    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } =
      await supabaseAnon.auth.signInWithPassword({
        email: authEmail,
        password,
      });

    if (authError) {
      // Si el password no matchea, puede ser un usuario nuevo que no tiene el password determinístico
      // Intentar actualizarlo con admin
      console.warn("[pin-login] signIn failed, updating password...");

      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(userData.auth_uid, {
          password,
        });

      if (updateError) {
        console.error("[pin-login] Password update failed:", updateError.message);
        return NextResponse.json(
          { error: "Error configurando sesión. Contacta al administrador." },
          { status: 500 },
        );
      }

      // Reintentar login
      const { data: retryData, error: retryError } =
        await supabaseAnon.auth.signInWithPassword({
          email: authEmail,
          password,
        });

      if (retryError) {
        console.error("[pin-login] Retry failed:", retryError.message);
        return NextResponse.json(
          { error: "Error de autenticación. Intenta de nuevo." },
          { status: 500 },
        );
      }

      return NextResponse.json({
        access_token: retryData.session!.access_token,
        refresh_token: retryData.session!.refresh_token,
        expires_at: retryData.session!.expires_at,
        user: {
          id: userData.id,
          auth_uid: userData.auth_uid,
          negocio_id: userData.negocio_id,
          nombre: userData.nombre,
          email: userData.email,
          rol: userData.rol,
        },
      });
    }

    // 3. Retornar tokens + datos del usuario
    return NextResponse.json({
      access_token: authData.session!.access_token,
      refresh_token: authData.session!.refresh_token,
      expires_at: authData.session!.expires_at,
      user: {
        id: userData.id,
        auth_uid: userData.auth_uid,
        negocio_id: userData.negocio_id,
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol,
      },
    });
  } catch (err) {
    console.error("[pin-login] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
