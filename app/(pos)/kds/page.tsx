"use client";

import { ChefHat } from "lucide-react";

export default function KDSPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <ChefHat size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Cocina (KDS)</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Kitchen Display System — Fase 3</p>
      </div>
    </div>
  );
}
