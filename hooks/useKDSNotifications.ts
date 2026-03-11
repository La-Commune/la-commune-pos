"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Genera tonos con Web Audio API — no necesita archivos .mp3
 */
function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);

    // Cleanup
    setTimeout(() => ctx.close(), (duration + 0.1) * 1000);
  } catch {
    // Audio not available (SSR, permissions, etc.)
  }
}

/** Sonido amigable: nueva orden llega (2 tonos ascendentes) */
function playNewOrderSound() {
  playTone(523, 0.15, "sine", 0.25); // C5
  setTimeout(() => playTone(659, 0.2, "sine", 0.25), 160); // E5
}

/** Sonido urgente: orden lleva mucho tiempo (3 tonos rápidos) */
function playUrgentSound() {
  playTone(880, 0.12, "square", 0.2); // A5
  setTimeout(() => playTone(880, 0.12, "square", 0.2), 180);
  setTimeout(() => playTone(1047, 0.25, "square", 0.2), 360); // C6
}

/**
 * Hook que detecta cambios en tickets KDS y emite notificaciones sonoras.
 * - Sonido al recibir un ticket nuevo (estado "nueva")
 * - Sonido cuando un ticket supera el umbral de urgencia (>10min preparando)
 */
export function useKDSNotifications(
  tickets: { id: string; estado: string; tiempo_inicio?: string | null }[],
  options: { enabled?: boolean; urgentThresholdMin?: number } = {},
) {
  const { enabled = true, urgentThresholdMin = 10 } = options;
  const prevTicketIds = useRef<Set<string>>(new Set());
  const alreadyAlertedUrgent = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!enabled || !tickets.length) return;

    const currentIds = new Set(tickets.map((t) => t.id as string));

    // Skip first render (avoid sound on page load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevTicketIds.current = currentIds;
      return;
    }

    // 1. Detectar tickets nuevos (IDs que no existían antes)
    const newTickets = tickets.filter(
      (t) => t.estado === "nueva" && !prevTicketIds.current.has(t.id),
    );
    if (newTickets.length > 0) {
      playNewOrderSound();
    }

    // 2. Detectar tickets urgentes (>10min preparando, no alertados aún)
    const urgentTickets = tickets.filter((t) => {
      if (t.estado !== "preparando" || !t.tiempo_inicio) return false;
      const mins = Math.floor((Date.now() - new Date(t.tiempo_inicio).getTime()) / 60000);
      return mins > urgentThresholdMin && !alreadyAlertedUrgent.current.has(t.id);
    });
    if (urgentTickets.length > 0) {
      playUrgentSound();
      urgentTickets.forEach((t) => alreadyAlertedUrgent.current.add(t.id));
    }

    // Update refs
    prevTicketIds.current = currentIds;

    // Cleanup: remove from urgent set if ticket no longer exists
    alreadyAlertedUrgent.current.forEach((id) => {
      if (!currentIds.has(id)) alreadyAlertedUrgent.current.delete(id);
    });
  }, [tickets, enabled, urgentThresholdMin]);
}
