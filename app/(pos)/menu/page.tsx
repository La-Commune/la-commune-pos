"use client";

import { UtensilsCrossed } from "lucide-react";

export default function MenuPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <UtensilsCrossed size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Menu</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Modulo de menu — Fase 3</p>
      </div>
    </div>
  );
}
