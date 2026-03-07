"use client";

import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";

interface PageErrorProps {
  message?: string;
  isOffline?: boolean;
  onRetry?: () => void;
}

export default function PageError({
  message,
  isOffline,
  onRetry,
}: PageErrorProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-status-err-bg flex items-center justify-center mx-auto mb-4">
          {isOffline ? (
            <WifiOff size={24} className="text-status-err" />
          ) : (
            <AlertTriangle size={24} className="text-status-err" />
          )}
        </div>
        <h3 className="text-sm font-medium text-text-100 mb-1">
          {isOffline ? "Sin conexión" : "Error al cargar"}
        </h3>
        <p className="text-xs text-text-45 mb-4">
          {message ||
            (isOffline
              ? "Verifica tu conexión a internet e intenta de nuevo."
              : "No se pudieron cargar los datos. Intenta de nuevo.")}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl btn-secondary text-[13px] min-h-[44px]"
          >
            <RefreshCw size={14} />
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
