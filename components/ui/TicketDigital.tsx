"use client";

import { useRef, useState } from "react";
import {
  X,
  Share2,
  MessageCircle,
  Copy,
  Printer,
  CheckCircle2,
  Download,
} from "lucide-react";
import { cn, formatMXN } from "@/lib/utils";
import { calcularIVA } from "@/hooks/useIVA";

/* ─── Types ─── */
export interface TicketItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  tamano?: string;
  notas?: string;
}

export interface TicketPago {
  metodo: "efectivo" | "tarjeta" | "transferencia";
  monto: number;
}

export interface TicketData {
  folio: number | null;
  fecha: Date;
  mesaNumero: number | null;
  origen: string;
  items: TicketItem[];
  subtotal: number;
  descuento: number;
  descuentoPct: number;
  propina: number;
  totalFinal: number;
  pagos: TicketPago[];
  cambio: number;
  atendidoPor: string;
  negocioNombre?: string;
  negocioDireccion?: string;
  negocioTelefono?: string;
}

const METODO_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

/* ─── Component ─── */
interface TicketDigitalProps {
  ticket: TicketData;
  onClose: () => void;
  className?: string;
}

export default function TicketDigital({ ticket, onClose, className }: TicketDigitalProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const desglose = calcularIVA(ticket.subtotal - ticket.descuento);

  const fechaStr = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ticket.fecha);

  /* ── Build plain text version ── */
  const buildTicketText = () => {
    const lines: string[] = [];
    const w = 40; // ancho de caracteres

    lines.push("═".repeat(w));
    lines.push(centerText(ticket.negocioNombre || "La Commune", w));
    if (ticket.negocioDireccion) lines.push(centerText(ticket.negocioDireccion, w));
    if (ticket.negocioTelefono) lines.push(centerText(ticket.negocioTelefono, w));
    lines.push("═".repeat(w));
    lines.push("");

    // Folio + fecha
    if (ticket.folio) lines.push(`Folio: #${ticket.folio}`);
    lines.push(`Fecha: ${fechaStr}`);
    if (ticket.mesaNumero) lines.push(`Mesa: ${ticket.mesaNumero}`);
    lines.push(`Atendió: ${ticket.atendidoPor}`);
    lines.push("");
    lines.push("─".repeat(w));

    // Items
    for (const item of ticket.items) {
      const qty = `${item.cantidad}x`;
      const total = formatMXN(item.precio_unitario * item.cantidad);
      const nameWidth = w - qty.length - total.length - 4;
      const name = item.nombre.length > nameWidth
        ? item.nombre.substring(0, nameWidth - 1) + "…"
        : item.nombre;
      lines.push(`${qty} ${name.padEnd(nameWidth)} ${total}`);
      if (item.tamano) lines.push(`   ${item.tamano}`);
      if (item.notas) lines.push(`   * ${item.notas}`);
    }

    lines.push("─".repeat(w));

    // Totales
    lines.push(padLine("Subtotal", formatMXN(ticket.subtotal), w));
    if (ticket.descuento > 0) {
      lines.push(padLine(`Descuento (${ticket.descuentoPct}%)`, `-${formatMXN(ticket.descuento)}`, w));
    }
    lines.push(padLine("Base gravable", formatMXN(desglose.baseGravable), w));
    lines.push(padLine("IVA (16%)", formatMXN(desglose.iva), w));
    if (ticket.propina > 0) {
      lines.push(padLine("Propina", formatMXN(ticket.propina), w));
    }
    lines.push("═".repeat(w));
    lines.push(padLine("TOTAL", formatMXN(ticket.totalFinal), w));
    lines.push("═".repeat(w));
    lines.push("");

    // Pagos
    for (const pago of ticket.pagos) {
      lines.push(padLine(METODO_LABELS[pago.metodo] || pago.metodo, formatMXN(pago.monto), w));
    }
    if (ticket.cambio > 0) {
      lines.push(padLine("Cambio", formatMXN(ticket.cambio), w));
    }

    lines.push("");
    lines.push(centerText("¡Gracias por tu visita!", w));
    lines.push(centerText("Te esperamos pronto", w));
    lines.push("");

    return lines.join("\n");
  };

  /* ── Actions ── */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildTicketText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = buildTicketText();
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(buildTicketText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handlePrint = () => {
    // Create a print-only window with the ticket
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket #${ticket.folio || "S/N"}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            padding: 8px;
            max-width: 80mm;
            margin: 0 auto;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .separator { border-top: 1px dashed #000; margin: 6px 0; }
          .double-separator { border-top: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; }
          .total-row { font-size: 14px; font-weight: bold; }
          .item-note { padding-left: 16px; font-size: 11px; color: #555; }
        </style>
      </head>
      <body>
        <div class="double-separator"></div>
        <div class="center bold" style="font-size: 16px;">${ticket.negocioNombre || "La Commune"}</div>
        ${ticket.negocioDireccion ? `<div class="center" style="font-size: 11px;">${ticket.negocioDireccion}</div>` : ""}
        ${ticket.negocioTelefono ? `<div class="center" style="font-size: 11px;">${ticket.negocioTelefono}</div>` : ""}
        <div class="double-separator"></div>

        ${ticket.folio ? `<div class="row"><span>Folio:</span><span>#${ticket.folio}</span></div>` : ""}
        <div class="row"><span>Fecha:</span><span>${fechaStr}</span></div>
        ${ticket.mesaNumero ? `<div class="row"><span>Mesa:</span><span>${ticket.mesaNumero}</span></div>` : ""}
        <div class="row"><span>Atendió:</span><span>${ticket.atendidoPor}</span></div>

        <div class="separator"></div>

        ${ticket.items.map(item => `
          <div class="row">
            <span>${item.cantidad}x ${item.nombre}${item.tamano ? ` (${item.tamano})` : ""}</span>
            <span>${formatMXN(item.precio_unitario * item.cantidad)}</span>
          </div>
          ${item.notas ? `<div class="item-note">* ${item.notas}</div>` : ""}
        `).join("")}

        <div class="separator"></div>

        <div class="row"><span>Subtotal</span><span>${formatMXN(ticket.subtotal)}</span></div>
        ${ticket.descuento > 0 ? `<div class="row"><span>Descuento (${ticket.descuentoPct}%)</span><span>-${formatMXN(ticket.descuento)}</span></div>` : ""}
        <div class="row"><span>Base gravable</span><span>${formatMXN(desglose.baseGravable)}</span></div>
        <div class="row"><span>IVA (16%)</span><span>${formatMXN(desglose.iva)}</span></div>
        ${ticket.propina > 0 ? `<div class="row"><span>Propina</span><span>${formatMXN(ticket.propina)}</span></div>` : ""}

        <div class="double-separator"></div>
        <div class="row total-row"><span>TOTAL</span><span>${formatMXN(ticket.totalFinal)}</span></div>
        <div class="double-separator"></div>

        ${ticket.pagos.map(p => `<div class="row"><span>${METODO_LABELS[p.metodo] || p.metodo}</span><span>${formatMXN(p.monto)}</span></div>`).join("")}
        ${ticket.cambio > 0 ? `<div class="row"><span>Cambio</span><span>${formatMXN(ticket.cambio)}</span></div>` : ""}

        <br>
        <div class="center">¡Gracias por tu visita!</div>
        <div class="center">Te esperamos pronto</div>
        <br>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([buildTicketText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ticket-${ticket.folio || "sn"}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Ticket container */}
      <div className="relative w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 rounded-full bg-surface-2 border border-border text-text-45 hover:text-text-100 transition-colors min-w-[40px] flex items-center justify-center shadow-lg"
          aria-label="Cerrar ticket"
        >
          <X size={16} />
        </button>

        {/* Ticket visual */}
        <div
          ref={ticketRef}
          className="bg-[#faf9f6] rounded-2xl shadow-2xl overflow-hidden border border-black/5"
          style={{ color: "#1a1a1a" }}
        >
          {/* Header con patrón de puntos de corte */}
          <div className="relative">
            <div className="flex justify-center gap-[6px] py-1 bg-[#f0ede5]">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className="w-[5px] h-[5px] rounded-full bg-[#d4cfc3]" />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 font-mono text-[13px] leading-relaxed">
            {/* Negocio */}
            <div className="text-center mb-4">
              <h3 className="text-base font-bold tracking-wide" style={{ color: "#1a1a1a" }}>
                {ticket.negocioNombre || "La Commune"}
              </h3>
              {ticket.negocioDireccion && (
                <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>{ticket.negocioDireccion}</p>
              )}
              {ticket.negocioTelefono && (
                <p className="text-[11px]" style={{ color: "#666" }}>{ticket.negocioTelefono}</p>
              )}
            </div>

            {/* Separator */}
            <div className="border-t-2 border-dashed mb-3" style={{ borderColor: "#d4cfc3" }} />

            {/* Meta info */}
            <div className="space-y-0.5 mb-3 text-[12px]" style={{ color: "#444" }}>
              {ticket.folio && (
                <div className="flex justify-between">
                  <span>Folio</span>
                  <span className="font-semibold" style={{ color: "#1a1a1a" }}>#{ticket.folio}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Fecha</span>
                <span>{fechaStr}</span>
              </div>
              {ticket.mesaNumero && (
                <div className="flex justify-between">
                  <span>Mesa</span>
                  <span className="font-semibold" style={{ color: "#1a1a1a" }}>{ticket.mesaNumero}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Atendió</span>
                <span>{ticket.atendidoPor}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-t border-dashed mb-3" style={{ borderColor: "#d4cfc3" }} />

            {/* Items */}
            <div className="space-y-1.5 mb-3">
              {ticket.items.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold" style={{ color: "#1a1a1a" }}>{item.cantidad}x </span>
                      <span style={{ color: "#333" }}>{item.nombre}</span>
                      {item.tamano && (
                        <span className="text-[11px] ml-1" style={{ color: "#888" }}>({item.tamano})</span>
                      )}
                    </div>
                    <span className="font-medium tabular-nums whitespace-nowrap" style={{ color: "#1a1a1a" }}>
                      {formatMXN(item.precio_unitario * item.cantidad)}
                    </span>
                  </div>
                  {item.notas && (
                    <p className="text-[11px] pl-4 mt-0.5" style={{ color: "#888" }}>* {item.notas}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Separator */}
            <div className="border-t border-dashed mb-3" style={{ borderColor: "#d4cfc3" }} />

            {/* Totales */}
            <div className="space-y-1 text-[12px] mb-2">
              <div className="flex justify-between" style={{ color: "#444" }}>
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMXN(ticket.subtotal)}</span>
              </div>
              {ticket.descuento > 0 && (
                <div className="flex justify-between" style={{ color: "#22c55e" }}>
                  <span>Descuento ({ticket.descuentoPct}%)</span>
                  <span className="tabular-nums">-{formatMXN(ticket.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ color: "#666" }}>
                <span>Base gravable</span>
                <span className="tabular-nums">{formatMXN(desglose.baseGravable)}</span>
              </div>
              <div className="flex justify-between" style={{ color: "#666" }}>
                <span>IVA (16%)</span>
                <span className="tabular-nums">{formatMXN(desglose.iva)}</span>
              </div>
              {ticket.propina > 0 && (
                <div className="flex justify-between" style={{ color: "#C49A3C" }}>
                  <span>Propina</span>
                  <span className="tabular-nums">{formatMXN(ticket.propina)}</span>
                </div>
              )}
            </div>

            {/* Total grande */}
            <div className="border-t-2 border-b-2 py-2.5 my-3" style={{ borderColor: "#1a1a1a" }}>
              <div className="flex justify-between items-center">
                <span className="text-base font-bold" style={{ color: "#1a1a1a" }}>TOTAL</span>
                <span className="text-xl font-bold tabular-nums" style={{ color: "#1a1a1a" }}>
                  {formatMXN(ticket.totalFinal)}
                </span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="space-y-1 text-[12px] mb-3">
              {ticket.pagos.map((pago, idx) => (
                <div key={idx} className="flex justify-between" style={{ color: "#444" }}>
                  <span>{METODO_LABELS[pago.metodo] || pago.metodo}</span>
                  <span className="tabular-nums font-medium">{formatMXN(pago.monto)}</span>
                </div>
              ))}
              {ticket.cambio > 0 && (
                <div className="flex justify-between font-semibold" style={{ color: "#22c55e" }}>
                  <span>Cambio</span>
                  <span className="tabular-nums">{formatMXN(ticket.cambio)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-dashed pt-3 text-center" style={{ borderColor: "#d4cfc3" }}>
              <p className="text-[12px] font-medium" style={{ color: "#444" }}>¡Gracias por tu visita!</p>
              <p className="text-[11px]" style={{ color: "#888" }}>Te esperamos pronto</p>
            </div>
          </div>

          {/* Bottom tear pattern */}
          <div className="flex justify-center gap-[6px] py-1 bg-[#f0ede5]">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-[5px] h-[5px] rounded-full bg-[#d4cfc3]" />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2 justify-center relative">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-100 text-[13px] font-medium hover:bg-surface-3 transition-all min-h-[44px]"
            aria-label="Imprimir ticket"
          >
            <Printer size={16} />
            Imprimir
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-[#25D366] text-[13px] font-medium hover:bg-[#25D366]/20 transition-all min-h-[44px]"
            aria-label="Enviar por WhatsApp"
          >
            <MessageCircle size={16} />
            WhatsApp
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-100 text-[13px] font-medium hover:bg-surface-3 transition-all min-h-[44px]"
            aria-label={copied ? "Copiado" : "Copiar ticket"}
          >
            {copied ? <CheckCircle2 size={16} className="text-status-ok" /> : <Copy size={16} />}
            {copied ? "Copiado" : "Copiar"}
          </button>

          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-100 text-[13px] font-medium hover:bg-surface-3 transition-all min-h-[44px]"
            aria-label="Descargar ticket"
          >
            <Download size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */
function centerText(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

function padLine(left: string, right: string, width: number): string {
  const space = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(space) + right;
}
