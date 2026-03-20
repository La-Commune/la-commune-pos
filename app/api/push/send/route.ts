import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiAuth } from "@/lib/api-auth";
import webpush from "web-push";

/**
 * POST /api/push/send
 * Envía notificaciones push directamente desde el POS.
 * Usa web-push para el protocolo Web Push + VAPID.
 *
 * Requiere en .env.local:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Supabase config incompleta en push/send: URL=${url ? "ok" : "FALTA"}, SERVICE_KEY=${key ? "ok" : "FALTA"}`
    );
  }

  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  const auth = await verifyApiAuth(req, ["admin", "barista", "gerente"]);
  if (!auth.ok) return auth.response;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error("[api/push/send] Faltan VAPID keys en env vars");
    return NextResponse.json(
      { error: "VAPID keys no configuradas. Agrega NEXT_PUBLIC_VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY en .env.local" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { clienteId, title, body: mensaje, tipo, enviadoPor } = body;

    if (!title || !mensaje || !tipo) {
      return NextResponse.json(
        { error: "title, body y tipo son requeridos" },
        { status: 400 }
      );
    }

    webpush.setVapidDetails(
      "mailto:deivod_halo@hotmail.com",
      vapidPublicKey,
      vapidPrivateKey
    );

    const supabase = getSupabase();

    // Obtener suscripciones activas
    let query = supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth_key, cliente_id")
      .eq("activa", true);

    if (clienteId) {
      query = query.eq("cliente_id", clienteId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("[api/push/send] Error obteniendo suscripciones:", subError.message);
      return NextResponse.json(
        { error: `Error obteniendo suscripciones: ${subError.message}` },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        enviadas: 0,
        fallidas: 0,
        message: "No hay suscripciones activas",
      });
    }

    const notificationPayload = JSON.stringify({
      title,
      body: mensaje,
      url: body.url || "/card/preview",
      tag: body.tag || `la-commune-${tipo}`,
      tipo,
    });

    let enviadas = 0;
    let fallidas = 0;
    const invalidEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          notificationPayload
        );
        enviadas++;
      } catch (err: any) {
        console.error(`[api/push/send] Error enviando a ${sub.id}:`, err.statusCode, err.body || err.message);
        if (err.statusCode === 410 || err.statusCode === 404) {
          invalidEndpoints.push(sub.endpoint);
        }
        fallidas++;
      }
    }

    // Desactivar suscripciones expiradas
    if (invalidEndpoints.length > 0) {
      await supabase
        .from("push_subscriptions")
        .update({ activa: false })
        .in("endpoint", invalidEndpoints);
    }

    // Registrar en log
    await supabase.from("push_notifications_log").insert({
      tipo,
      titulo: title,
      cuerpo: mensaje,
      cliente_id: clienteId || null,
      enviadas,
      fallidas,
      enviado_por: enviadoPor || null,
    });

    return NextResponse.json({
      enviadas,
      fallidas,
      total: subscriptions.length,
    });
  } catch (err) {
    console.error("[api/push/send] Error:", err);
    return NextResponse.json(
      { error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}
