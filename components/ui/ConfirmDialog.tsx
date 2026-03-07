"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import Modal from "./Modal";
import { cn } from "@/lib/utils";

type Variant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  loading?: boolean;
}

const variantConfig: Record<Variant, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  danger: { icon: Trash2, color: "text-status-err", bg: "bg-status-err-bg" },
  warning: { icon: AlertTriangle, color: "text-status-warn", bg: "bg-status-warn-bg" },
  info: { icon: Info, color: "text-status-info", bg: "bg-status-info-bg" },
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus cancel button when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => cancelRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="text-center py-2" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-desc">
        <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center mx-auto mb-4`}>
          <Icon size={24} className={config.color} aria-hidden="true" />
        </div>
        <h3 id="confirm-title" className="text-base font-semibold text-text-100 mb-2">{title}</h3>
        <p id="confirm-desc" className="text-sm text-text-45 mb-6 leading-relaxed">{description}</p>
        <div className="flex items-center gap-3">
          <button
            ref={cancelRef}
            onClick={onClose}
            disabled={loading}
            aria-disabled={loading || undefined}
            className={cn(
              "flex-1 py-3 rounded-xl btn-ghost text-[13px] font-medium min-h-[44px]",
              loading && "opacity-50 cursor-not-allowed"
            )}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            aria-disabled={loading || undefined}
            className={cn(
              "flex-1 py-3 rounded-xl text-[13px] font-semibold min-h-[44px] transition-all duration-300",
              variant === "danger"
                ? "bg-status-err text-white hover:opacity-90"
                : "btn-primary",
              loading && "opacity-50 cursor-wait"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Procesando...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
