"use client";

import { ClipboardList } from "lucide-react";

export default function OrdenesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Ordenes</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Modulo de ordenes — Fase 2</p>
      </div>
    </div>
  );
}
