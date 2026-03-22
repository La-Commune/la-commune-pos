import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyApiAuth } from "@/lib/api-auth";

// Schema de validación para acciones de sync
const SyncActionSchema = z.object({
  type: z.enum([
    "INSERT_ORDEN",
    "UPDATE_ORDEN",
    "INSERT_PAGO",
    "UPDATE_MESA",
    "UPDATE_TICKET_KDS",
  ]),
  payload: z.record(z.string(), z.unknown()),
  timestamp: z.string().datetime().optional(),
});

const SyncRequestSchema = z.object({
  actions: z.array(SyncActionSchema).min(1).max(100),
});

// POST /api/sync — procesa acciones offline pendientes
// Requiere: JWT válido (cualquier rol autenticado)
export async function POST(request: Request) {
  try {
    // Verificar que el caller esté autenticado
    const auth = await verifyApiAuth(request);
    if (!auth.ok) return auth.response;

    const body = await request.json();

    // Validar estructura del request
    const parsed = SyncRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Payload inválido",
          details: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { actions } = parsed.data;

    // TODO: Procesar cada acción contra Supabase
    // Por ahora retornamos éxito
    const results = actions.map((action) => ({
      type: action.type,
      status: "synced" as const,
    }));

    return NextResponse.json({ results, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
