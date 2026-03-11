"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Upload,
  Trash2,
  ChevronDown,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNegocioCompleto } from "@/hooks/useSupabase";
import { showToast } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import type { HorarioDia, HorarioSemanal, RedesSociales } from "@/types/database";

// ── Días de la semana ──
const DIAS: { key: keyof HorarioSemanal; label: string; short: string }[] = [
  { key: "lunes", label: "Lunes", short: "Lun" },
  { key: "martes", label: "Martes", short: "Mar" },
  { key: "miercoles", label: "Miércoles", short: "Mié" },
  { key: "jueves", label: "Jueves", short: "Jue" },
  { key: "viernes", label: "Viernes", short: "Vie" },
  { key: "sabado", label: "Sábado", short: "Sáb" },
  { key: "domingo", label: "Domingo", short: "Dom" },
];

const DEFAULT_DIA: HorarioDia = { abierto: true, apertura: "08:00", cierre: "20:00" };

// ── Toggle reutilizable (touch-friendly 44px) ──
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        "w-12 h-7 rounded-full transition-all duration-200 relative shrink-0",
        "min-h-[44px] min-w-[44px] flex items-center",
        value ? "bg-accent" : "bg-surface-3"
      )}
      style={{ minHeight: 32, minWidth: 48 }}
    >
      <div
        className={cn(
          "w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-200",
          value ? "left-[24px]" : "left-1"
        )}
      />
    </button>
  );
}

// ── Input reutilizable (touch-friendly) ──
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
        {Icon && <Icon size={15} className="text-text-muted" />}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-3 rounded-xl text-sm",
          "bg-surface-2 border border-border",
          "text-text-primary placeholder:text-text-muted",
          "focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent",
          "transition-all duration-200"
        )}
      />
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

// ── Card section wrapper con animación ──
function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  defaultOpen = true,
}: {
  icon: typeof Store;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  // mounted controla si el contenido está en el DOM (se mantiene durante la animación de cierre)
  const [mounted, setMounted] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Al abrir → montar inmediatamente (el efecto de abajo se encarga de animar)
  // Al cerrar → animar primero, desmontar después
  useEffect(() => {
    if (open) {
      setMounted(true);
    }
  }, [open]);

  // Animar cuando mounted + open cambian
  useEffect(() => {
    // Skip la primera renderización (ya está abierto, no necesita animación)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const el = contentRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    if (open) {
      // ── Abrir: 0 → altura real → quitar max-height ──
      const height = inner.scrollHeight;
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
      // Force reflow para que el browser registre el estado inicial
      void el.offsetHeight;
      el.style.maxHeight = `${height}px`;
      el.style.opacity = "1";

      const timer = setTimeout(() => {
        // Quitar max-height para que el contenido pueda crecer si cambia
        el.style.maxHeight = "none";
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // ── Cerrar: altura actual → 0 → desmontar ──
      const height = inner.scrollHeight;
      // Fijar altura actual como punto de partida
      el.style.maxHeight = `${height}px`;
      el.style.opacity = "1";
      void el.offsetHeight;
      // Animar hacia 0
      el.style.maxHeight = "0px";
      el.style.opacity = "0";

      const timer = setTimeout(() => {
        setMounted(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface-1 overflow-hidden",
        "shadow-card"
      )}
    >
      {/* Card header */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-4 px-5 py-4",
          "hover:bg-surface-2/50 transition-colors duration-200 ease-smooth",
          "min-h-[56px] text-left"
        )}
      >
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            "transition-colors duration-300 ease-smooth",
            open ? "bg-accent/15 text-accent" : "bg-surface-3 text-text-muted"
          )}
        >
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="text-xs text-text-muted mt-0.5 truncate">{description}</p>
        </div>
        <ChevronDown
          size={18}
          className={cn(
            "text-text-muted shrink-0 transition-transform duration-300 ease-smooth",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Card content — se mantiene montado durante la animación de cierre */}
      {mounted && (
        <div
          ref={contentRef}
          className="overflow-hidden"
          style={{
            maxHeight: defaultOpen && isFirstRender.current ? "none" : undefined,
            transition: "max-height 0.3s var(--ease), opacity 0.25s var(--ease)",
            willChange: "max-height, opacity",
          }}
        >
          <div ref={innerRef} className="px-5 pb-5 pt-1 space-y-4 border-t border-border">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Página principal ──
function ConfiguracionContent() {
  const { negocio, loading, updateNegocio, refetch } = useNegocioCompleto();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Upload logo ──
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !negocio) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("negocio_id", negocio.id);

      const res = await fetch("/api/upload-logo", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error ?? "Error al subir imagen", "error");
        return;
      }

      set("logo_url", data.url);
      await refetch();
      showToast("Logo actualizado", "success");
    } catch {
      showToast("Error de conexión al subir imagen", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    set("logo_url", null);
    const result = await updateNegocio({ logo_url: null } as Partial<Record<string, unknown>>);
    if (result.success) {
      await refetch();
      showToast("Logo eliminado", "success");
    } else {
      showToast(result.error ?? "Error al eliminar logo", "error");
    }
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Sticky Header ── */}
      <header className="shrink-0 px-5 py-4 border-b border-border bg-surface-1/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings size={18} className="text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary leading-tight">Configuración</h1>
              <p className="text-xs text-text-muted">Personaliza tu negocio</p>
            </div>
          </div>

          {/* Botón guardar sticky */}
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium",
              "transition-all duration-300",
              dirty
                ? "bg-accent text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-surface-3 text-text-muted cursor-not-allowed"
            )}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Guardando..." : dirty ? "Guardar cambios" : "Sin cambios"}
          </button>
        </div>
      </header>

      {/* ── Scrollable Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-5 py-5 space-y-4">
          {/* ── Masonry: 2 columnas en tablet, fluye sin huecos ── */}
          <div className="columns-1 lg:columns-2 gap-4 [&>*]:break-inside-avoid [&>*]:mb-4">
            {/* ═══ GENERAL ═══ */}
            <SectionCard
              icon={Store}
              title="General"
              description="Nombre, logo y branding"
            >
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

              {/* Logo upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <ImageIcon size={15} className="text-text-muted" />
                  Logo
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview circular */}
                  <div
                    className={cn(
                      "w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0",
                      "transition-colors duration-200",
                      (form.logo_url as string)
                        ? "border-accent/30 bg-surface-2"
                        : "border-border bg-surface-2"
                    )}
                  >
                    {(form.logo_url as string) ? (
                      <img
                        src={form.logo_url as string}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ImageIcon size={28} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium",
                        "bg-surface-3 text-text-primary hover:bg-surface-4",
                        "border border-border transition-all min-h-[44px]",
                        "disabled:opacity-50"
                      )}
                    >
                      {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {uploading ? "Subiendo..." : "Subir"}
                    </button>
                    {(form.logo_url as string) && (
                      <button
                        onClick={handleRemoveLogo}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-status-error hover:bg-status-error-bg transition-all min-h-[36px]"
                      >
                        <Trash2 size={13} />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-muted">PNG, JPG o WebP · Máx 5MB</p>
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Palette size={15} className="text-text-muted" />
                  Color primario
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(form.color_primario as string) ?? "#C49A3C"}
                    onChange={(e) => set("color_primario", e.target.value)}
                    className="w-11 h-11 rounded-xl cursor-pointer border border-border"
                  />
                  <input
                    type="text"
                    value={(form.color_primario as string) ?? "#C49A3C"}
                    onChange={(e) => set("color_primario", e.target.value)}
                    className={cn(
                      "w-28 px-3 py-2.5 rounded-xl text-sm font-mono",
                      "bg-surface-2 border border-border text-text-primary",
                      "focus:outline-none focus:ring-2 focus:ring-accent/30"
                    )}
                  />
                  <div
                    className="flex-1 h-11 rounded-xl border border-border"
                    style={{ backgroundColor: (form.color_primario as string) ?? "#C49A3C" }}
                  />
                </div>
              </div>
            </SectionCard>

            {/* ═══ CONTACTO ═══ */}
            <SectionCard
              icon={Phone}
              title="Contacto"
              description="Teléfono, email y redes sociales"
            >
              <Field
                label="Dirección"
                icon={MapPin}
                value={(form.direccion as string) ?? ""}
                onChange={(v) => set("direccion", v)}
                placeholder="Calle, Colonia, Ciudad"
              />
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
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
              </div>

              {/* Redes */}
              <div className="pt-2 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Redes sociales</div>
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
                  placeholder="facebook.com/micafe"
                />
                <Field
                  label="Google Maps"
                  icon={MapPin}
                  value={redes.google_maps ?? ""}
                  onChange={(v) => setRedes("google_maps", v)}
                  placeholder="maps.google.com/..."
                  hint="Para que tus clientes te encuentren"
                />
              </div>
            </SectionCard>

            {/* ═══ FISCAL ═══ */}
            <SectionCard
              icon={Building2}
              title="Fiscal"
              description="RFC, razón social y régimen"
            >
              <Field
                label="Razón social"
                icon={Building2}
                value={(form.razon_social as string) ?? ""}
                onChange={(v) => set("razon_social", v)}
                placeholder="Mi Café S.A. de C.V."
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="RFC"
                  icon={FileText}
                  value={(form.rfc as string) ?? ""}
                  onChange={(v) => set("rfc", v.toUpperCase())}
                  placeholder="XAXX010101000"
                />
                <Field
                  label="C.P. Fiscal"
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
                hint="Ej: 626 - RESICO, 612 - Persona Física"
              />
            </SectionCard>

            {/* ═══ OPERACIÓN ═══ */}
            <SectionCard
              icon={Clock}
              title="Operación"
              description="IVA, propinas y horario"
            >
              {/* IVA toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2/70 border border-border">
                <div className="flex-1 mr-3">
                  <div className="text-sm font-medium text-text-primary">IVA incluido en precios</div>
                  <div className="text-xs text-text-muted mt-0.5">Precios del menú incluyen 16% IVA</div>
                </div>
                <Toggle
                  value={(form.iva_incluido as boolean) ?? true}
                  onChange={(v) => set("iva_incluido", v)}
                />
              </div>

              {/* Propinas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Percent size={15} className="text-text-muted" />
                  Propinas sugeridas
                </label>
                <div className="flex items-center gap-2">
                  {propinas.map((p, i) => (
                    <div key={i} className="relative flex-1">
                      <input
                        type="number"
                        value={p}
                        onChange={(e) => setPropina(i, Number(e.target.value))}
                        min={0}
                        max={100}
                        className={cn(
                          "w-full px-3 py-3 rounded-xl text-sm text-center",
                          "bg-surface-2 border border-border text-text-primary",
                          "focus:outline-none focus:ring-2 focus:ring-accent/30"
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted">Opciones rápidas al cobrar</p>
              </div>

              {/* Horario compacto */}
              <div className="space-y-2 pt-1">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                  <Clock size={15} className="text-text-muted" />
                  Horario
                </label>
                <div className="space-y-1.5">
                  {DIAS.map(({ key, label, short }) => {
                    const dia = horario[key] ?? DEFAULT_DIA;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all",
                          dia.abierto
                            ? "bg-surface-2 border-border"
                            : "bg-surface-1 border-border opacity-50"
                        )}
                      >
                        <Toggle value={dia.abierto} onChange={(v) => setHorario(key, "abierto", v)} />
                        <span className="w-10 text-sm text-text-primary font-medium hidden sm:block">{label}</span>
                        <span className="w-8 text-sm text-text-primary font-medium sm:hidden">{short}</span>
                        {dia.abierto ? (
                          <div className="flex items-center gap-1.5 ml-auto text-sm">
                            <input
                              type="time"
                              value={dia.apertura}
                              onChange={(e) => setHorario(key, "apertura", e.target.value)}
                              className={cn(
                                "px-2 py-1.5 rounded-lg bg-surface-3 border border-border text-text-primary text-xs",
                                "focus:outline-none focus:ring-1 focus:ring-accent/30"
                              )}
                            />
                            <span className="text-text-muted text-xs">–</span>
                            <input
                              type="time"
                              value={dia.cierre}
                              onChange={(e) => setHorario(key, "cierre", e.target.value)}
                              className={cn(
                                "px-2 py-1.5 rounded-lg bg-surface-3 border border-border text-text-primary text-xs",
                                "focus:outline-none focus:ring-1 focus:ring-accent/30"
                              )}
                            />
                          </div>
                        ) : (
                          <span className="text-xs text-text-muted italic ml-auto">Cerrado</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>

            {/* ═══ RECIBOS ═══ */}
              <SectionCard
                icon={Receipt}
                title="Recibos"
                description="Personaliza el ticket impreso"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Editor */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-text-secondary flex items-center gap-1.5">
                      <Receipt size={15} className="text-text-muted" />
                      Pie de ticket
                    </label>
                    <textarea
                      value={(form.footer_ticket as string) ?? ""}
                      onChange={(e) => set("footer_ticket", e.target.value)}
                      placeholder="¡Gracias por tu visita!"
                      rows={4}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-sm",
                        "bg-surface-2 border border-border",
                        "text-text-primary placeholder:text-text-muted",
                        "focus:outline-none focus:ring-2 focus:ring-accent/30",
                        "resize-none"
                      )}
                    />
                    <p className="text-xs text-text-muted">
                      Aparece al final del ticket. Incluye redes sociales, promociones, etc.
                    </p>
                  </div>

                  {/* Preview compacto */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">Vista previa</div>
                    <div className="p-4 rounded-xl bg-surface-2/50 flex justify-center">
                    <div className="bg-white text-black p-5 rounded-lg w-[260px] font-mono text-[11px] space-y-1.5 shadow-lg ring-1 ring-black/5">
                      <div className="text-center font-bold text-xs">
                        {(form.nombre as string) || "Mi Negocio"}
                      </div>
                      {(form.slogan as string) && (
                        <div className="text-center text-[9px] text-gray-400">
                          {form.slogan as string}
                        </div>
                      )}
                      {(form.direccion as string) && (
                        <div className="text-center text-[9px]">{form.direccion as string}</div>
                      )}
                      {(form.telefono as string) && (
                        <div className="text-center text-[9px]">Tel: {form.telefono as string}</div>
                      )}
                      <div className="border-t border-dashed border-gray-300 my-1.5" />
                      <div className="flex justify-between">
                        <span>1x Americano 12oz</span>
                        <span>$55.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1x Croissant</span>
                        <span>$45.00</span>
                      </div>
                      <div className="border-t border-dashed border-gray-300 my-1.5" />
                      <div className="flex justify-between font-bold text-xs">
                        <span>TOTAL</span>
                        <span>$100.00</span>
                      </div>
                      {(form.rfc as string) && (
                        <div className="text-center text-[9px] mt-1">RFC: {form.rfc as string}</div>
                      )}
                      <div className="border-t border-dashed border-gray-300 my-1.5" />
                      <div className="text-center text-[9px] italic">
                        {(form.footer_ticket as string) || "¡Gracias por tu visita!"}
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
          </div>

          {/* Spacer para que el último card no quede pegado al borde */}
          <div className="h-4" />
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
