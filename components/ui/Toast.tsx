"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { timing, ease } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════
 * Toast System — Premium framer-motion animated toasts
 *
 * Upgrade: CSS slideInRight → framer-motion spring entry/exit,
 * animated stacking when multiple toasts, y-axis repositioning.
 * ══════════════════════════════════════════════════════════════ */

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styleMap = {
  success: "bg-status-ok-bg border-[rgba(74,222,128,0.2)] text-status-ok",
  error: "bg-status-err-bg border-[rgba(248,113,113,0.2)] text-status-err",
  info: "bg-status-info-bg border-[rgba(96,165,250,0.2)] text-status-info",
};

// Event-based toast system (unchanged API)
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: ToastType = "success", duration?: number) {
  const toast: Toast = { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, message, type, duration };
  listeners.forEach((fn) => fn(toast));
}

/* ─── Animation variants ─── */
const toastVariants = {
  initial: {
    opacity: 0,
    x: 80,
    scale: 0.92,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring" as const,
      stiffness: 380,
      damping: 28,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    x: 60,
    scale: 0.95,
    filter: "blur(2px)",
    transition: {
      duration: timing.normal,
      ease: ease.in,
    },
  },
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    const dur = toast.duration ?? (toast.type === "error" ? 5000 : 3500);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, dur);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none"
      aria-label="Notificaciones"
      role="region"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              aria-atomic="true"
              className={cn(
                "pointer-events-auto flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[280px] max-w-sm",
                styleMap[toast.type],
              )}
            >
              <Icon size={16} className="flex-shrink-0" aria-hidden="true" />
              <span className="text-xs font-medium flex-1">{toast.message}</span>
              <motion.button
                onClick={() => dismiss(toast.id)}
                aria-label={`Cerrar notificación: ${toast.message}`}
                whileHover={{ scale: 1.15, opacity: 1 }}
                whileTap={{ scale: 0.9 }}
                className="p-0.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
