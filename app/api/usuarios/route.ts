import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyApiAuth } from "@/lib/api-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
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
 * POST /api/usuarios
 * Crea Auth user + registro en tabla usuarios
 * Body: { nombre, email, rol, pin, negocio_id }
 * Requiere: JWT válido con rol admin
 */
export async function POST(request: Request) {
  try {
    // Verificar que el caller sea admin autenticado
    const auth = await verifyApiAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.nombre || !body?.email || !body?.rol || !body?.negocio_id) {
      return NextResponse.json(
        { error: "Campos requeridos: nombre, email, rol, negocio_id" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Crear Auth user con password temporal
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: tempPassword,
        email_confirm: true,
      });

    if (authError) {
      // Si el email ya existe, buscar el auth_uid existente
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "Ya existe un usuario con ese email" },
          { status: 409 },
        );
      }
      console.error("[usuarios/create] Auth error:", authError.message);
      return NextResponse.json(
        { error: authError.message },
        { status: 500 },
      );
    }

    const authUid = authUser.user.id;

    // 2. Setear password determinístico para login por PIN
    const detPassword = derivePinPassword(authUid);
    const { error: pwError } =
      await supabaseAdmin.auth.admin.updateUserById(authUid, {
        password: detPassword,
      });

    if (pwError) {
      console.error("[usuarios/create] Password update error:", pwError.message);
    }

    // 3. Insertar en tabla usuarios
    const { data: usuario, error: insertError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        auth_uid: authUid,
        negocio_id: body.negocio_id,
        nombre: body.nombre,
        email: body.email,
        rol: body.rol,
        pin: body.pin || null,
        activo: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[usuarios/create] Insert error:", insertError.message);
      // Cleanup: eliminar Auth user si falla el insert
      await supabaseAdmin.auth.admin.deleteUser(authUid);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, usuario });
  } catch (err) {
    console.error("[usuarios/create] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/usuarios
 * Actualiza datos del usuario (tabla + Auth si cambia email)
 * Body: { id, auth_uid, nombre?, email?, rol?, pin?, activo? }
 * Requiere: JWT válido con rol admin
 */
export async function PUT(request: Request) {
  try {
    // Verificar que el caller sea admin autenticado
    const auth = await verifyApiAuth(request, ["admin"]);
    if (!auth.ok) return auth.response;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuración de Supabase incompleta" },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body?.id) {
      return NextResponse.json(
        { error: "Campo requerido: id" },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Construir update payload para tabla usuarios
    const updateData: Record<string, unknown> = {
      actualizado_en: new Date().toISOString(),
    };
    if (body.nombre !== undefined) updateData.nombre = body.nombre;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.rol !== undefined) updateData.rol = body.rol;
    if (body.pin !== undefined) updateData.pin = body.pin;
    if (body.activo !== undefined) updateData.activo = body.activo;

    // Update tabla usuarios
    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update(updateData)
      .eq("id", body.id);

    if (updateError) {
      console.error("[usuarios/update] Error:", updateError.message);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 },
      );
    }

    // Si cambió el email, actualizar también en Auth
    if (body.email && body.auth_uid) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(body.auth_uid, {
          email: body.email,
        });
      if (authUpdateError) {
        console.warn("[usuarios/update] Auth email update error:", authUpdateError.message);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[usuarios/update] Unexpected error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
