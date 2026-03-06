"use client";

import { BarChart3 } from "lucide-react";

export default function ReportesPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 size={24} className="text-accent" />
        <h1 className="text-2xl font-display text-text-100">Reportes</h1>
      </div>
      <div className="flex items-center justify-center h-64 rounded-lg card-warm">
        <p className="text-text-45 text-sm">Modulo de reportes — Fase 4</p>
      </div>
    </div>
  );
}
