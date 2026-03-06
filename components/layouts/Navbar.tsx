"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, User, Clock, LogOut, ChevronDown } from "lucide-react";
import { useSyncStore } from "@/store/sync.store";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

function LiveClock() {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date())
      );
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-2 text-text-45 text-xs tabular-nums">
      <Clock size={14} />
      {time}
    </div>
  );
}

export default function Navbar() {
  const { isOnline, pendingActions, isSyncing } = useSyncStore();
  const { user, logout } = useAuthStore();
  const [menuUsuario, setMenuUsuario] = useState(false);

  return (
    <header className="h-14 bg-surface-1/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-6">
      <div id="navbar-title" className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-text-100 tracking-tight">
          La Commune POS
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {pendingActions > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-status-warn-bg text-status-warn text-xs font-medium">
            <RefreshCw
              size={13}
              className={cn(isSyncing && "animate-spin")}
            />
            {pendingActions} pendiente{pendingActions > 1 ? "s" : ""}
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
            isOnline
              ? "text-status-ok bg-status-ok-bg"
              : "text-status-err bg-status-err-bg"
          )}
        >
          {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isOnline ? "En línea" : "Sin conexión"}
        </div>

        <LiveClock />

        {user && (
          <div className="relative">
            <button
              onClick={() => setMenuUsuario(!menuUsuario)}
              className="flex items-center gap-2.5 ml-2 pl-3 border-l border-border hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                <User size={14} className="text-accent" />
              </div>
              <div className="text-xs text-left">
                <p className="text-text-100 font-medium">{user.nombre}</p>
                <p className="text-text-45 capitalize">{user.rol}</p>
              </div>
              <ChevronDown size={14} className="text-text-45" />
            </button>

            {menuUsuario && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuUsuario(false)} />
                <div className="absolute right-0 top-14 w-48 py-1.5 bg-surface-3 border border-border rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setMenuUsuario(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-status-err hover:bg-status-err-bg transition-all duration-200"
                  >
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
