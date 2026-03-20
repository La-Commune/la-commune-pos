import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api-auth";

/**
 * POST /api/push/send
 * Proxy que llama a la Edge Function send-push.
 * Evita problemas de CORS al ser mismo-origen.
 */
export async function POST(req: NextRequest) {
  // Verificar que el usuario esté autenticado (admin o barista)
  const auth = await verifyApiAuth(req, ["admin", "barista", "gerente"]);
  if (!auth.ok) return auth.response;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: "Configuración de Supabase incompleta" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // Llamar a la Edge Function con service_role (sin CORS)
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[api/push/send] Error:", err);
    return NextResponse.json(
      { error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}
