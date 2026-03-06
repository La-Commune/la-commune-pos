"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
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

export function showToast(message: string, type: ToastType = "success") {
  const toast: Toast = { id: `toast-${Date.now()}`, message, type };
  listeners.forEach((fn) => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 3500);
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => { listeners.delete(addToast); };
  }, [addToast]);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 pl-4 pr-3 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right min-w-[280px] max-w-sm",
              styleMap[toast.type]
            )}
            style={{
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="text-xs font-medium flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
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
