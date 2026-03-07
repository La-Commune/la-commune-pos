"use client";

import { AlertTriangle, Trash2, XCircle } from "lucide-react";
import Modal from "./Modal";

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
  info: { icon: XCircle, color: "text-status-info", bg: "bg-status-info-bg" },
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

  return (
    <Modal open={open} onClose={onClose} title="" size="sm">
      <div className="text-center py-2">
        <div className={`w-14 h-14 rounded-2xl ${config.bg} flex items-center justify-center mx-auto mb-4`}>
          <Icon size={24} className={config.color} />
        </div>
        <h3 className="text-base font-semibold text-text-100 mb-2">{title}</h3>
        <p className="text-sm text-text-45 mb-6 leading-relaxed">{description}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-xl btn-ghost text-[13px] font-medium min-h-[44px]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl text-[13px] font-semibold min-h-[44px] transition-all duration-300 ${
              variant === "danger"
                ? "bg-status-err text-white hover:opacity-90"
                : "btn-primary"
            } ${loading ? "opacity-50 cursor-wait" : ""}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
