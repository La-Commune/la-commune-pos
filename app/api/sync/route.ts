import { NextResponse } from "next/server";

// POST /api/sync — procesa acciones offline pendientes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actions } = body;

    if (!Array.isArray(actions) || actions.length === 0) {
      return NextResponse.json(
        { error: "No actions provided" },
        { status: 400 }
      );
    }

    // TODO: Procesar cada acción contra Supabase
    // Por ahora retornamos éxito
    const results = actions.map((action: { type: string; payload: unknown }) => ({
      type: action.type,
      status: "synced",
    }));

    return NextResponse.json({ results, syncedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
