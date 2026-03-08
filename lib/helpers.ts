// ── Utility functions reutilizables ──
// Extraído de lógica duplicada en páginas

import { ORIGEN_LABEL, NIVEL_CONFIG } from "./constants";

/**
 * Devuelve el color CSS de una categoría por su índice (orden en el array).
 * Usa las 8 variables --cat-1 a --cat-8 del tema activo. Cicla si hay más.
 */
export function getCatColor(index: number): string {
  return `var(--cat-${(index % 8) + 1})`;
}

/**
 * Extrae las iniciales de un nombre completo
 * Ej: "David López" → "DL"
 */
export function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

/**
 * Formatea el origen de la orden para display
 * Ej: "para_llevar" → "Para llevar"
 */
export function formatOrigen(origen: string): string {
  return ORIGEN_LABEL[origen as keyof typeof ORIGEN_LABEL] || origen;
}

/**
 * Obtiene el config del nivel de fidelidad
 * Ej: "oro" → { label: "Oro", color: "...", ... }
 */
export function getNivelConfig(nivel: string) {
  return NIVEL_CONFIG[nivel as keyof typeof NIVEL_CONFIG] || NIVEL_CONFIG.bronce;
}

/**
 * Calcula tiempo transcurrido en formato legible
 * Ej: 5 minutos → "5m", 1.5 horas → "1h 30m"
 */
export function tiempoTranscurrido(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/**
 * Calcula el tiempo de preparación en minutos
 * Retorna null si aún no ha iniciado
 */
export function tiempoPreparacion(inicio: string | null, fin: string | null): number | null {
  if (!inicio) return null;
  const end = fin ? new Date(fin).getTime() : Date.now();
  return Math.floor((end - new Date(inicio).getTime()) / 60000);
}

/**
 * Retorna el color del timer según tiempo de preparación
 * Verde (<5m), Naranja (5-10m), Rojo (>10m)
 */
export function timerColor(mins: number | null): string {
  if (mins === null) return "text-text-25";
  if (mins <= 5) return "text-status-ok";
  if (mins <= 10) return "text-status-warn";
  return "text-status-err";
}

/**
 * Determina si un ticket es urgente
 * Un ticket es urgente si lleva >10 minutos en preparación
 */
export function esUrgente(estado: string, tiempoPrep: number | null): boolean {
  return estado === "preparando" && tiempoPrep !== null && tiempoPrep > 10;
}

/**
 * Formatea un nombre de usuario para display
 * Capitaliza la primera letra de cada palabra
 */
export function formatNombreUsuario(nombre: string): string {
  return nombre
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Calcula el siguiente nivel de fidelidad
 * Retorna null si ya está en oro
 */
export function proximoNivel(nivelActual: string): { nivel: string; puntosFaltantes: number } | null {
  if (nivelActual === "oro") return null;
  if (nivelActual === "bronce") return { nivel: "plata", puntosFaltantes: 500 };
  if (nivelActual === "plata") return { nivel: "oro", puntosFaltantes: 1000 };
  return null;
}

/**
 * Determina el nivel de fidelidad según puntos
 */
export function getNivelPorPuntos(puntos: number): "bronce" | "plata" | "oro" {
  if (puntos >= 1000) return "oro";
  if (puntos >= 500) return "plata";
  return "bronce";
}
