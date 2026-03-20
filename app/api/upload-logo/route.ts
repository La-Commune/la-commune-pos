import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { verifyApiAuth } from "@/lib/api-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB input (before resize)
const OUTPUT_SIZE = 512; // px — logo cuadrado
const OUTPUT_QUALITY = 85; // webp quality

/**
 * POST /api/upload-logo
 * Body: FormData con campo "file" (image) y "negocio_id" (string)
 * Requiere: JWT válido con rol admin
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar que el caller sea admin autenticado
    const auth = await verifyApiAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const negocioId = formData.get("negocio_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 });
    }

    if (!negocioId) {
      return NextResponse.json({ error: "Falta negocio_id" }, { status: 400 });
    }

    // Validar tipo
    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo no permitido. Usa PNG, JPG o WebP" },
        { status: 400 }
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Archivo muy grande. Máximo 5MB" },
        { status: 400 }
      );
    }

    // Leer buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Resize + convertir a webp con sharp
    let outputBuffer: Buffer;
    if (file.type === "image/svg+xml") {
      // SVG: convertir directo a webp
      outputBuffer = await sharp(inputBuffer)
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: OUTPUT_QUALITY })
        .toBuffer();
    } else {
      outputBuffer = await sharp(inputBuffer)
        .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: OUTPUT_QUALITY })
        .toBuffer();
    }

    // Subir a Supabase Storage
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const filePath = `${negocioId}/logo.webp`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, outputBuffer, {
        contentType: "image/webp",
        upsert: true, // Reemplazar si ya existe
      });

    if (uploadError) {
      console.error("[upload-logo] Storage error:", uploadError);
      return NextResponse.json(
        { error: "Error al subir imagen: " + uploadError.message },
        { status: 500 }
      );
    }

    // Obtener URL pública con cache buster para forzar refresh en el navegador
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(filePath);
    const logoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    // Actualizar logo_url en negocios
    const { error: updateError } = await supabase
      .from("negocios")
      .update({ logo_url: logoUrl })
      .eq("id", negocioId);

    if (updateError) {
      console.error("[upload-logo] Update error:", updateError);
      // No fallar — la imagen ya se subió
    }

    return NextResponse.json({
      url: logoUrl,
      size: outputBuffer.length,
      dimensions: `${OUTPUT_SIZE}x${OUTPUT_SIZE}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload-logo] Error:", message, err);
    return NextResponse.json(
      { error: "Error procesando imagen: " + message },
      { status: 500 }
    );
  }
}
