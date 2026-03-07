"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

// Simple event-based toast system
const listeners: Set<(toast: Toast) => void> = new Set();

export function showToast(message: string, type: ToastType = "success", duration?: number) {
  const toast: Toast = { id: `toast-${Date.now()}`, message, type, duration };
  listeners.forEach((fn) => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dismissing, setDismissing] = useState<string | null>(null);

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
    setDismissing(id);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setDismissing(null);
    }, 200);
  };

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      aria-label="Notificaciones"
      role="region"
    >
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            aria-live={toast.type === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[280px] max-w-sm transition-all duration-200",
              styleMap[toast.type],
              dismissing === toast.id ? "opacity-0 translate-x-full" : "animate-[slideInRight_0.3s_ease-out]"
            )}
          >
            <Icon size={16} className="flex-shrink-0" aria-hidden="true" />
            <span className="text-xs font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label={`Cerrar notificación: ${toast.message}`}
              className="p-0.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
