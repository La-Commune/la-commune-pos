"use client";

import { Wifi, WifiOff, RefreshCw, User, Clock } from "lucide-react";
import { useSyncStore } from "@/store/sync.store";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { isOnline, pendingActions, isSyncing } = useSyncStore();
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-surface-1 border-b border-border flex items-center justify-between px-6">
      {/* Left — Module title populated by page */}
      <div id="navbar-title" className="flex items-center gap-3">
        <h1 className="text-lg font-medium text-text-100 tracking-tight">
          La Commune POS
        </h1>
      </div>

      {/* Right — Status indicators */}
      <div className="flex items-center gap-4">
        {/* Sync status */}
        {pendingActions > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-status-warn-bg text-status-warn text-xs font-medium">
            <RefreshCw
              size={14}
              className={cn(isSyncing && "animate-spin")}
            />
            {pendingActions} pendiente{pendingActions > 1 ? "s" : ""}
          </div>
        )}

        {/* Connection status */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-sm text-xs font-medium",
            isOnline
              ? "text-status-ok bg-status-ok-bg"
              : "text-status-err bg-status-err-bg"
          )}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? "En linea" : "Sin conexion"}
        </div>

        {/* Clock */}
        <div className="text-text-25 text-xs">
          <Clock size={14} />
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="w-7 h-7 rounded-sm bg-surface-2 flex items-center justify-center">
              <User size={14} className="text-text-45" />
            </div>
            <div className="text-xs">
              <p className="text-text-100 font-medium">{user.nombre}</p>
              <p className="text-text-25 capitalize">{user.rol}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
