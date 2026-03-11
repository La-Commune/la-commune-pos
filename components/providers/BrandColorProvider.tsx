"use client";

import { useEffect } from "react";
import { useNegocio } from "@/hooks/useSupabase";

/**
 * BrandColorProvider
 *
 * Lee `color_primario` del negocio en BD y sobreescribe las CSS vars
 * de accent del tema activo. Usa `color-mix(in oklch, ...)` para
 * generar toda la paleta desde un solo color.
 *
 * Variables que sobreescribe:
 *   --accent           → color sólido
 *   --accent-soft      → 9% opacidad (fondos sutiles)
 *   --accent-mid       → 18% opacidad (hover, badges)
 *   --btn-gradient     → gradiente sólido para botones
 *   --shadow-glow      → glow sutil para CTAs
 *
 * Se monta en el POS layout y actúa globalmente.
 * Si no hay color_primario en BD, no hace nada (los temas default aplican).
 */
export default function BrandColorProvider() {
  const negocio = useNegocio();
  const colorPrimario = negocio?.color_primario ?? null;

  useEffect(() => {
    if (!colorPrimario) return;

    // Validar que sea un color hex válido
    const isValidHex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(colorPrimario);
    if (!isValidHex) return;

    const root = document.documentElement;

    // Color sólido
    root.style.setProperty("--accent", colorPrimario);

    // Variantes con opacidad (soft = 9%, mid = 18%)
    // Usamos color-mix en oklch para consistencia perceptual
    root.style.setProperty(
      "--accent-soft",
      `color-mix(in oklch, ${colorPrimario} 9%, transparent)`
    );
    root.style.setProperty(
      "--accent-mid",
      `color-mix(in oklch, ${colorPrimario} 18%, transparent)`
    );

    // Gradiente para botones: color → versión más oscura
    root.style.setProperty(
      "--btn-gradient",
      `linear-gradient(135deg, ${colorPrimario} 0%, color-mix(in oklch, ${colorPrimario} 75%, black) 100%)`
    );

    // Glow sutil para sombras de CTA
    root.style.setProperty(
      "--shadow-glow",
      `0 0 20px color-mix(in oklch, ${colorPrimario} 30%, transparent)`
    );

    // Cleanup: quitar overrides cuando el componente se desmonte
    return () => {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-soft");
      root.style.removeProperty("--accent-mid");
      root.style.removeProperty("--btn-gradient");
      root.style.removeProperty("--shadow-glow");
    };
  }, [colorPrimario]);

  return null;
}
