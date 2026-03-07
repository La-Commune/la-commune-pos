"use client";

import { useState, useEffect, useCallback } from "react";

/** Format elapsed time from ISO string */
export function formatTiempoTranscurrido(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remainMins}m`;
  return `${Math.floor(hrs / 24)}d ${hrs % 24}h`;
}

/** Hook that auto-refreshes elapsed time */
export function useTiempoTranscurrido(iso: string | null, intervalMs = 10000) {
  const [texto, setTexto] = useState(() => iso ? formatTiempoTranscurrido(iso) : "");

  useEffect(() => {
    if (!iso) return;
    setTexto(formatTiempoTranscurrido(iso));
    const timer = setInterval(() => setTexto(formatTiempoTranscurrido(iso)), intervalMs);
    return () => clearInterval(timer);
  }, [iso, intervalMs]);

  return texto;
}

/** Get color class based on elapsed minutes for KDS */
export function getTimerColor(iso: string): "ok" | "warn" | "error" {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins <= 5) return "ok";
  if (mins <= 10) return "warn";
  return "error";
}
