"use client";

import { CreditCard } from "lucide-react";

export default function CobrosPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CreditCard size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Cobros</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Modulo de cobros — Fase 4</p>
      </div>
    </div>
  );
}
