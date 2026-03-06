"use client";

import { Heart } from "lucide-react";

export default function FidelidadPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Heart size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Fidelidad</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Puente Firebase — Fase 5</p>
      </div>
    </div>
  );
}
