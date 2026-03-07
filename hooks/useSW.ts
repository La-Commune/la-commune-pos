"use client";

import { useEffect, useCallback } from "react";
import { useSyncStore } from "@/store/sync.store";
import { getPendingActions, removeAction } from "@/lib/offline-queue";

/**
 * Hook que registra el Service Worker, escucha mensajes de sync,
 * y procesa la cola offline cuando se recupera conexión.
 */
export function useSW() {
  const { setOnline } = useSyncStore();

  // Procesar cola offline
  const processQueue = useCallback(async () => {
    const actions = await getPendingActions();
    if (actions.length === 0) return;

    for (const action of actions) {
      try {
        // Aquí se procesará cada acción cuando Supabase esté conectado
        // Por ahora solo logueamos y removemos
        console.log(`[SW] Procesando acción offline: ${action.type}`, action.payload);
        await removeAction(action.id!);
      } catch (err) {
        console.error(`[SW] Error procesando acción ${action.id}:`, err);
        break; // Parar al primer error para reintentar después
      }
    }
  }, []);

  useEffect(() => {
    // ── Registrar SW ──
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Registrado:", reg.scope);

          // Escuchar actualizaciones
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // Hay una actualización disponible — activar inmediatamente
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                }
              });
            }
          });
        })
        .catch((err) => console.error("[SW] Error al registrar:", err));

      // Escuchar mensajes del SW (sync offline)
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_OFFLINE_QUEUE") {
          processQueue();
        }
      });
    }

    // ── Online / Offline listeners ──
    const handleOnline = () => {
      setOnline(true);
      processQueue();
      // Intentar background sync
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((reg) => {
          // SyncManager no está en los tipos estándar de TS, usar interface extendida
          const syncReg = reg as ServiceWorkerRegistration & {
            sync?: { register: (tag: string) => Promise<void> };
          };
          syncReg.sync?.register("sync-offline-actions");
        });
      }
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Estado inicial
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline, processQueue]);
}
