"use client";

import { Users } from "lucide-react";

export default function UsuariosPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Users size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Usuarios</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Gestion de staff — Fase 5</p>
      </div>
    </div>
  );
}
