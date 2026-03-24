"use client";

import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════════
   Base Skeleton — shimmer placeholder
   ══════════════════════════════════════════════════════════════ */
interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  style?: React.CSSProperties;
}

export function Skeleton({ className, rounded = "xl", style }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "skeleton-shimmer",
        {
          "rounded-sm": rounded === "sm",
          "rounded-md": rounded === "md",
          "rounded-lg": rounded === "lg",
          "rounded-xl": rounded === "xl",
          "rounded-2xl": rounded === "2xl",
          "rounded-full": rounded === "full",
        },
        className,
      )}
      style={style}
    />
  );
}

/* ══════════════════════════════════════════════════════════════
   ContentReveal — smooth fade-in when content replaces skeleton

   Wraps real content so it fades in with a subtle blur→clear
   and slide-up transition. Use `stagger` for grids/lists to
   cascade children appearance.
   ══════════════════════════════════════════════════════════════ */
interface ContentRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger children animations (for grids/lists) */
  stagger?: boolean;
}

export function ContentReveal({ children, className, stagger }: ContentRevealProps) {
  return (
    <div
      className={cn(
        stagger ? "content-reveal-stagger" : "content-reveal",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI Card Skeleton — Dashboard
   ══════════════════════════════════════════════════════════════ */
export function SkeletonKPICard() {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl bg-surface-2 border border-border">
      <Skeleton className="w-11 h-11 shrink-0" rounded="xl" />
      <div className="flex-1 space-y-2.5 pt-0.5">
        <Skeleton className="h-3 w-20" rounded="md" />
        <Skeleton className="h-6 w-24" rounded="md" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Stat Card Skeleton — Reportes
   ══════════════════════════════════════════════════════════════ */
export function SkeletonStatCard() {
  return (
    <div className="p-5 rounded-xl bg-surface-2 border border-border">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" rounded="md" />
        <Skeleton className="w-4 h-4" rounded="md" />
      </div>
      <div className="flex items-end justify-between">
        <Skeleton className="h-7 w-28" rounded="md" />
        <Skeleton className="h-5 w-14" rounded="lg" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Table Skeleton — Usuarios
   ══════════════════════════════════════════════════════════════ */
function SkeletonTableRow({ cols = 5, index = 0 }: { cols?: number; index?: number }) {
  // Vary widths per row to look more organic
  const widths = [
    ["w-28", "w-36", "w-16", "w-14", "w-20", "w-12", "w-8"],
    ["w-32", "w-28", "w-20", "w-16", "w-14", "w-10", "w-8"],
    ["w-24", "w-32", "w-14", "w-12", "w-24", "w-14", "w-8"],
    ["w-36", "w-24", "w-[72px]", "w-14", "w-16", "w-12", "w-8"],
    ["w-20", "w-36", "w-16", "w-16", "w-20", "w-10", "w-8"],
    ["w-[120px]", "w-28", "w-14", "w-12", "w-[72px]", "w-14", "w-8"],
  ];
  const row = widths[index % widths.length];

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-border/30">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", row[i] || "w-16")}
          rounded="md"
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="Cargando tabla" className="rounded-xl bg-surface-2 border border-border overflow-hidden">
      <span className="sr-only">Cargando datos…</span>
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 bg-surface-3/30 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" rounded="md" />
        ))}
      </div>
      {/* Rows with varied widths */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} index={i} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Mesa Card Skeleton — Mesas grid
   ══════════════════════════════════════════════════════════════ */
export function SkeletonMesaCard() {
  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" rounded="md" />
        <Skeleton className="h-5 w-[72px]" rounded="full" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-28" rounded="md" />
        <Skeleton className="h-3 w-16" rounded="md" />
      </div>
    </div>
  );
}

export function SkeletonMesaGrid({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando mesas" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 content-reveal-stagger">
      <span className="sr-only">Cargando mesas…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMesaCard key={i} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Product Card Skeleton — Menú
   ══════════════════════════════════════════════════════════════ */
export function SkeletonProductCard() {
  return (
    <div className="rounded-2xl bg-surface-2 border border-border border-l-[4px] border-l-surface-3 p-3.5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" rounded="md" />
          <Skeleton className="h-3 w-32" rounded="md" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-4 w-16" rounded="md" />
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
    </div>
  );
}

export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando productos" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 content-reveal-stagger">
      <span className="sr-only">Cargando productos…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Chart Skeleton — Reportes
   ══════════════════════════════════════════════════════════════ */
export function SkeletonChart({ height = 180 }: { height?: number }) {
  const barHeights = [45, 72, 35, 82, 55, 68, 40];
  return (
    <div
      className="rounded-xl bg-surface-2 border border-border p-5"
      style={{ height }}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-28" rounded="md" />
        <Skeleton className="h-6 w-24" rounded="lg" />
      </div>
      <div className="flex items-end gap-3 h-[calc(100%-3.5rem)] px-2">
        {barHeights.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1.5">
            <Skeleton
              className="w-full min-w-[16px]"
              rounded="sm"
              style={{ height: `${h}%` }}
            />
            <Skeleton className="h-2 w-6" rounded="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Order Card Skeleton — Órdenes
   ══════════════════════════════════════════════════════════════ */
export function SkeletonOrderCard() {
  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" rounded="md" />
          <Skeleton className="h-5 w-20" rounded="full" />
        </div>
        <Skeleton className="h-4 w-12" rounded="md" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" rounded="md" />
        <Skeleton className="h-3 w-3/4" rounded="md" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <Skeleton className="h-5 w-20" rounded="md" />
        <Skeleton className="h-8 w-24" rounded="lg" />
      </div>
    </div>
  );
}

export function SkeletonOrderList({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando órdenes" className="space-y-3 content-reveal-stagger">
      <span className="sr-only">Cargando órdenes…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonOrderCard key={i} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KDS Ticket Skeleton — Cocina
   ══════════════════════════════════════════════════════════════ */
export function SkeletonKDSTicket() {
  return (
    <div className="rounded-xl bg-surface-2 border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-surface-3/30 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14" rounded="md" />
          <Skeleton className="h-5 w-16" rounded="full" />
        </div>
        <Skeleton className="h-5 w-10" rounded="md" />
      </div>
      {/* Items */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" rounded="md" />
        <Skeleton className="h-4 w-3/4" rounded="md" />
        <Skeleton className="h-4 w-1/2" rounded="md" />
      </div>
      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30 flex gap-2">
        <Skeleton className="h-9 flex-1" rounded="lg" />
        <Skeleton className="h-9 w-9" rounded="lg" />
      </div>
    </div>
  );
}

export function SkeletonKDSGrid({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando tickets" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-reveal-stagger">
      <span className="sr-only">Cargando tickets…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonKDSTicket key={i} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Client/User List Item Skeleton — Fidelidad
   ══════════════════════════════════════════════════════════════ */
export function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30">
      <Skeleton className="w-10 h-10 shrink-0" rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" rounded="md" />
        <Skeleton className="h-3 w-20" rounded="md" />
      </div>
      <Skeleton className="h-5 w-14" rounded="full" />
    </div>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Cargando lista" className="rounded-xl bg-surface-2 border border-border overflow-hidden">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Quick Link Skeleton — Dashboard
   ══════════════════════════════════════════════════════════════ */
export function SkeletonQuickLink() {
  return (
    <div className="flex flex-col items-center gap-2.5 p-4 rounded-xl bg-surface-2 border border-border">
      <Skeleton className="w-11 h-11" rounded="xl" />
      <Skeleton className="h-3 w-12" rounded="md" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Alert Card Skeleton — Dashboard
   ══════════════════════════════════════════════════════════════ */
export function SkeletonAlertCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-2 border border-border">
      <Skeleton className="w-5 h-5 shrink-0" rounded="md" />
      <Skeleton className="h-4 flex-1 max-w-[180px]" rounded="md" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Cobro Detail Skeleton — Cobros
   ══════════════════════════════════════════════════════════════ */
export function SkeletonCobroDetail() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-surface-2 border border-border">
        <div className="flex justify-between mb-4">
          <Skeleton className="h-5 w-24" rounded="md" />
          <Skeleton className="h-5 w-20" rounded="full" />
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" rounded="md" />
              <Skeleton className="h-4 w-16" rounded="md" />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/30 flex justify-between">
          <Skeleton className="h-5 w-16" rounded="md" />
          <Skeleton className="h-6 w-24" rounded="md" />
        </div>
      </div>
      {/* Payment buttons */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12" rounded="xl" />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Caja Skeleton — Cash Register
   ══════════════════════════════════════════════════════════════ */
export function SkeletonCaja() {
  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="p-5 rounded-xl bg-surface-2 border border-border">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-28" rounded="md" />
          <Skeleton className="h-6 w-20" rounded="full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" rounded="md" />
              <Skeleton className="h-6 w-24" rounded="md" />
            </div>
          ))}
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1" rounded="xl" />
        <Skeleton className="h-12 flex-1" rounded="xl" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Top Product Bar Skeleton — Reportes
   ══════════════════════════════════════════════════════════════ */
export function SkeletonTopBar({ count = 5 }: { count?: number }) {
  const barWidths = [85, 70, 55, 40, 28];
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-4 h-4 shrink-0" rounded="md" />
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" rounded="md" />
              <Skeleton className="h-3 w-8" rounded="md" />
            </div>
            <Skeleton
              className="h-1.5"
              rounded="full"
              style={{ width: `${barWidths[i] ?? 30}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Fidelidad Detail Skeleton
   ══════════════════════════════════════════════════════════════ */
export function SkeletonFidelidadDetail() {
  return (
    <div className="space-y-4">
      {/* Client header */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-2 border border-border">
        <Skeleton className="w-14 h-14 shrink-0" rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" rounded="md" />
          <Skeleton className="h-3 w-24" rounded="md" />
          <Skeleton className="h-3 w-20" rounded="md" />
        </div>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 rounded-xl bg-surface-2 border border-border text-center space-y-1.5">
            <Skeleton className="h-3 w-14 mx-auto" rounded="md" />
            <Skeleton className="h-6 w-10 mx-auto" rounded="md" />
          </div>
        ))}
      </div>
      {/* Cards */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl bg-surface-2 border border-border space-y-2">
            <Skeleton className="h-4 w-28" rounded="md" />
            <Skeleton className="h-3 w-full" rounded="md" />
            <Skeleton className="h-3 w-3/4" rounded="md" />
          </div>
        ))}
      </div>
    </div>
  );
}
