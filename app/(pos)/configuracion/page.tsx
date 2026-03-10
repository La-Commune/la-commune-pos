"use client";

import { useState, useCallback } from "react";
import {
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Receipt,
  Clock,
  Percent,
  Save,
  Loader2,
  Instagram,
  Facebook,
  Image as ImageIcon,
  Palette,
  FileText,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNegocioCompleto } from "@/hooks/useSupabase";
import { showToast } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { HorarioDia, HorarioSemanal, RedesSociales } from "@/types/database";

// ── Secciones de configuración ──
type Section = "general" | "contacto" | "fiscal" | "operacion" | "recibos";

const sections: { id: Section; label: string; icon: typeof Store; desc: string }[] = [
  { id: "general", label: "General", icon: Store, desc: "Nombre, logo, branding" },
  { id: "contacto", label: "Contacto", icon: Phone, desc: "Teléfono, email, redes" },
  { id: "fiscal", label: "Fiscal", icon: Building2, desc: "RFC, razón social" },
  { id: "operacion", label: "Operación", icon: Clock, desc: "Horario, propinas, IVA" },
  { id: "recibos", label: "Recibos", icon: Receipt, desc: "Footer del ticket" },
];

// ── Días de la semana ──
const DIAS: { key: keyof HorarioSemanal; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const DEFAULT_DIA: HorarioDia = { abierto: true, apertura: "08:00", cierre: "20:00" };

// ── Componente Input reutilizable ──
function Field({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  icon?: typeof Store;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
        {Icon && <Icon size={14} className="text-text-muted" />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 rounded-lg text-sm",
          "bg-surface-2 border border-border-subtle",
          "text-text-primary placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
          "transition-all duration-200"
        )}
      />
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

// ── Página principal ──
function ConfiguracionContent() {
  const { negocio, loading, updateNegocio } = useNegocioCompleto();
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [saving, setSaving] = useState(false);

  // ── Form state ──
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);

  // Initialize form from negocio
  const initForm = useCallback(() => {
    if (!negocio) return;
    setForm({
      nombre: negocio.nombre ?? "",
      slogan: negocio.slogan ?? "",
      logo_url: negocio.logo_url ?? "",
      color_primario: negocio.color_primario ?? "#C49A3C",
      direccion: negocio.direccion ?? "",
      telefono: negocio.telefono ?? "",
      email: negocio.email ?? "",
      sitio_web: negocio.sitio_web ?? "",
      whatsapp: negocio.whatsapp ?? "",
      redes_sociales: negocio.redes_sociales ?? {},
      razon_social: negocio.razon_social ?? "",
      rfc: negocio.rfc ?? "",
      regimen_fiscal: negocio.regimen_fiscal ?? "",
      codigo_postal_fiscal: negocio.codigo_postal_fiscal ?? "",
      footer_ticket: negocio.footer_ticket ?? "¡Gracias por tu visita!",
      horario: negocio.horario ?? {},
      propina_sugerida: negocio.propina_sugerida ?? [10, 15, 20],
      iva_incluido: negocio.iva_incluido ?? true,
    });
    setDirty(false);
  }, [negocio]);

  // Init on load
  useState(() => { initForm(); });

  // Re-init when negocio changes
  const [prevNegocioId, setPrevNegocioId] = useState<string | null>(null);
  if (negocio && negocio.id !== prevNegocioId) {
    setPrevNegocioId(negocio.id);
    initForm();
  }

  const set = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const setRedes = (key: keyof RedesSociales, value: string) => {
    setForm((prev) => ({
      ...prev,
      redes_sociales: { ...(prev.redes_sociales as RedesSociales), [key]: value },
    }));
    setDirty(true);
  };

  const setHorario = (dia: string, field: keyof HorarioDia, value: string | boolean) => {
    setForm((prev) => {
      const h = (prev.horario as Record<string, HorarioDia>) ?? {};
      return {
        ...prev,
        horario: {
          ...h,
          [dia]: { ...(h[dia] ?? DEFAULT_DIA), [field]: value },
        },
      };
    });
    setDirty(true);
  };

  const setPropina = (index: number, value: number) => {
    setForm((prev) => {
      const arr = [...((prev.propina_sugerida as number[]) ?? [10, 15, 20])];
      arr[index] = value;
      return { ...prev, propina_sugerida: arr };
    });
    setDirty(true);
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    const result = await updateNegocio(form as Record<string, unknown>);
    setSaving(false);
    if (result.success) {
      setDirty(false);
      showToast("Configuración guardada", "success");
    } else {
      showToast(result.error ?? "Error al guardar", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const redes = (form.redes_sociales ?? {}) as RedesSociales;
  const horario = (form.horario ?? {}) as Record<string, HorarioDia>;
  const propinas = (form.propina_sugerida ?? [10, 15, 20]) as number[];

  return (
    <div className="flex h-full gap-0">
      {/* ── Sidebar de secciones ── */}
      <aside className="w-56 shrink-0 border-r border-border-subtle bg-surface-1 p-3 space-y-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-text-muted px-3 py-2">
          Configuración
        </h2>
        {sections.map((s) => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text-primary"
              )}
            >
              <Icon size={16} />
              <div className="text-left">
                <div>{s.label}</div>
                <div className="text-[10px] text-text-muted font-normal">{s.desc}</div>
              </div>
            </button>
          );
        })}
      </aside>

      {/* ── Contenido ── */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">
                {sections.find((s) => s.id === activeSection)?.label}
              </h1>
              <p className="text-sm text-text-muted mt-0.5">
                {sections.find((s) => s.id === activeSection)?.desc}
              </p>
            </div>
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-accent text-white hover:bg-accent/90",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Guardar cambios
              </button>
            )}
          </div>

          <div className="h-px bg-border-subtle" />

          {/* ── GENERAL ── */}
          {activeSection === "general" && (
            <div className="space-y-5">
              <Field
                label="Nombre del negocio"
                icon={Store}
                value={(form.nombre as string) ?? ""}
                onChange={(v) => set("nombre", v)}
                placeholder="Mi Café"
              />
              <Field
                label="Slogan"
                icon={FileText}
                value={(form.slogan as string) ?? ""}
                onChange={(v) => set("slogan", v)}
                placeholder="El mejor café de la ciudad"
              />
              <Field
                label="URL del logo"
                icon={ImageIcon}
                value={(form.logo_url as string) ?? ""}
                onChange={(v) => set("logo_url", v)}
                placeholder="https://ejemplo.com/logo.png"
                hint="Se usará en recibos y la app de fidelidad"
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Palette size={14} className="text-text-muted" />
                  Color primario
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(form.color_primario as string) ?? "#C49A3C"}
                    onChange={(e) => set("color_primario", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-border-subtle"
                  />
                  <input
                    type="text"
                    value={(form.color_primario as string) ?? "#C49A3C"}
                    onChange={(e) => set("color_primario", e.target.value)}
                    className={cn(
                      "w-32 px-3 py-2 rounded-lg text-sm font-mono",
                      "bg-surface-2 border border-border-subtle text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30"
                    )}
                  />
                  <div
                    className="w-20 h-10 rounded-lg border border-border-subtle"
                    style={{ backgroundColor: (form.color_primario as string) ?? "#C49A3C" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── CONTACTO ── */}
          {activeSection === "contacto" && (
            <div className="space-y-5">
              <Field
                label="Dirección"
                icon={MapPin}
                value={(form.direccion as string) ?? ""}
                onChange={(v) => set("direccion", v)}
                placeholder="Calle, Colonia, Ciudad, Estado"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Teléfono"
                  icon={Phone}
                  value={(form.telefono as string) ?? ""}
                  onChange={(v) => set("telefono", v)}
                  placeholder="+52 771 123 4567"
                  type="tel"
                />
                <Field
                  label="WhatsApp"
                  icon={MessageCircle}
                  value={(form.whatsapp as string) ?? ""}
                  onChange={(v) => set("whatsapp", v)}
                  placeholder="+52 771 123 4567"
                  type="tel"
                />
              </div>
              <Field
                label="Email"
                icon={Mail}
                value={(form.email as string) ?? ""}
                onChange={(v) => set("email", v)}
                placeholder="contacto@micafe.com"
                type="email"
              />
              <Field
                label="Sitio web"
                icon={Globe}
                value={(form.sitio_web as string) ?? ""}
                onChange={(v) => set("sitio_web", v)}
                placeholder="https://micafe.com"
                type="url"
              />

              <div className="h-px bg-border-subtle" />
              <h3 className="text-sm font-semibold text-text-primary">Redes sociales</h3>

              <Field
                label="Instagram"
                icon={Instagram}
                value={redes.instagram ?? ""}
                onChange={(v) => setRedes("instagram", v)}
                placeholder="@micafe"
              />
              <Field
                label="Facebook"
                icon={Facebook}
                value={redes.facebook ?? ""}
                onChange={(v) => setRedes("facebook", v)}
                placeholder="https://facebook.com/micafe"
              />
              <Field
                label="Google Maps"
                icon={MapPin}
                value={redes.google_maps ?? ""}
                onChange={(v) => setRedes("google_maps", v)}
                placeholder="https://maps.google.com/..."
                hint="Link para que tus clientes te encuentren"
              />
            </div>
          )}

          {/* ── FISCAL ── */}
          {activeSection === "fiscal" && (
            <div className="space-y-5">
              <Field
                label="Razón social"
                icon={Building2}
                value={(form.razon_social as string) ?? ""}
                onChange={(v) => set("razon_social", v)}
                placeholder="Mi Café S.A. de C.V."
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="RFC"
                  icon={FileText}
                  value={(form.rfc as string) ?? ""}
                  onChange={(v) => set("rfc", v.toUpperCase())}
                  placeholder="XAXX010101000"
                />
                <Field
                  label="Código postal fiscal"
                  value={(form.codigo_postal_fiscal as string) ?? ""}
                  onChange={(v) => set("codigo_postal_fiscal", v)}
                  placeholder="42184"
                />
              </div>
              <Field
                label="Régimen fiscal"
                value={(form.regimen_fiscal as string) ?? ""}
                onChange={(v) => set("regimen_fiscal", v)}
                placeholder="Régimen Simplificado de Confianza"
                hint="Ejemplo: 626 - RESICO, 612 - Persona Física con Actividad Empresarial"
              />
            </div>
          )}

          {/* ── OPERACIÓN ── */}
          {activeSection === "operacion" && (
            <div className="space-y-6">
              {/* IVA */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-surface-2 border border-border-subtle">
                <div>
                  <div className="text-sm font-medium text-text-primary">IVA incluido en precios</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Los precios del menú ya incluyen 16% de IVA
                  </div>
                </div>
                <button
                  onClick={() => set("iva_incluido", !(form.iva_incluido as boolean))}
                  className={cn(
                    "w-11 h-6 rounded-full transition-all duration-200 relative",
                    (form.iva_incluido as boolean) ? "bg-accent" : "bg-surface-3"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all",
                      (form.iva_incluido as boolean) ? "left-[22px]" : "left-0.5"
                    )}
                  />
                </button>
              </div>

              {/* Propinas sugeridas */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Percent size={14} className="text-text-muted" />
                  Propinas sugeridas (%)
                </label>
                <div className="flex items-center gap-3">
                  {propinas.map((p, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        type="number"
                        value={p}
                        onChange={(e) => setPropina(i, Number(e.target.value))}
                        min={0}
                        max={100}
                        className={cn(
                          "w-20 px-3 py-2 rounded-lg text-sm text-center",
                          "bg-surface-2 border border-border-subtle text-text-primary",
                          "focus:outline-none focus:ring-2 focus:ring-accent/30"
                        )}
                      />
                      <span className="text-sm text-text-muted">%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted">
                  Se muestran como opciones rápidas al cobrar
                </p>
              </div>

              <div className="h-px bg-border-subtle" />

              {/* Horario */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Clock size={14} className="text-text-muted" />
                  Horario de operación
                </label>
                <div className="space-y-2">
                  {DIAS.map(({ key, label }) => {
                    const dia = horario[key] ?? DEFAULT_DIA;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          dia.abierto
                            ? "bg-surface-2 border-border-subtle"
                            : "bg-surface-1 border-border-subtle opacity-60"
                        )}
                      >
                        <button
                          onClick={() => setHorario(key, "abierto", !dia.abierto)}
                          className={cn(
                            "w-9 h-5 rounded-full transition-all duration-200 relative shrink-0",
                            dia.abierto ? "bg-accent" : "bg-surface-3"
                          )}
                        >
                          <div
                            className={cn(
                              "w-4 h-4 rounded-full bg-white shadow absolute top-0.5 transition-all",
                              dia.abierto ? "left-[18px]" : "left-0.5"
                            )}
                          />
                        </button>
                        <span className="w-24 text-sm text-text-primary font-medium">{label}</span>
                        {dia.abierto ? (
                          <div className="flex items-center gap-2 text-sm">
                            <input
                              type="time"
                              value={dia.apertura}
                              onChange={(e) => setHorario(key, "apertura", e.target.value)}
                              className={cn(
                                "px-2 py-1 rounded bg-surface-3 border border-border-subtle text-text-primary",
                                "focus:outline-none focus:ring-1 focus:ring-accent/30"
                              )}
                            />
                            <span className="text-text-muted">a</span>
                            <input
                              type="time"
                              value={dia.cierre}
                              onChange={(e) => setHorario(key, "cierre", e.target.value)}
                              className={cn(
                                "px-2 py-1 rounded bg-surface-3 border border-border-subtle text-text-primary",
                                "focus:outline-none focus:ring-1 focus:ring-accent/30"
                              )}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic">Cerrado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── RECIBOS ── */}
          {activeSection === "recibos" && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Receipt size={14} className="text-text-muted" />
                  Texto del pie de ticket
                </label>
                <textarea
                  value={(form.footer_ticket as string) ?? ""}
                  onChange={(e) => set("footer_ticket", e.target.value)}
                  placeholder="¡Gracias por tu visita!"
                  rows={3}
                  className={cn(
                    "w-full px-3 py-2 rounded-lg text-sm",
                    "bg-surface-2 border border-border-subtle",
                    "text-text-primary placeholder:text-text-muted",
                    "focus:outline-none focus:ring-2 focus:ring-accent/30",
                    "resize-none"
                  )}
                />
                <p className="text-xs text-text-muted">
                  Aparece al final del ticket impreso. Puedes incluir redes sociales, promociones, etc.
                </p>
              </div>

              {/* Preview del ticket */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-text-primary">Vista previa del ticket</h3>
                <div className="bg-white text-black p-6 rounded-lg max-w-xs mx-auto font-mono text-xs space-y-2 shadow-lg border">
                  <div className="text-center font-bold text-sm">
                    {(form.nombre as string) || "Mi Negocio"}
                  </div>
                  {(form.slogan as string) && (
                    <div className="text-center text-[10px] text-gray-500">
                      {form.slogan as string}
                    </div>
                  )}
                  {(form.direccion as string) && (
                    <div className="text-center text-[10px]">{form.direccion as string}</div>
                  )}
                  {(form.telefono as string) && (
                    <div className="text-center text-[10px]">Tel: {form.telefono as string}</div>
                  )}
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="flex justify-between">
                    <span>1x Americano 12oz</span>
                    <span>$55.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1x Croissant</span>
                    <span>$45.00</span>
                  </div>
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="flex justify-between font-bold">
                    <span>TOTAL</span>
                    <span>$100.00</span>
                  </div>
                  {(form.rfc as string) && (
                    <div className="text-center text-[10px] mt-2">RFC: {form.rfc as string}</div>
                  )}
                  <div className="border-t border-dashed border-gray-300 my-2" />
                  <div className="text-center text-[10px] italic">
                    {(form.footer_ticket as string) || "¡Gracias por tu visita!"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ConfiguracionPage() {
  return (
    <ErrorBoundary moduleName="Configuración">
      <ConfiguracionContent />
    </ErrorBoundary>
  );
}
