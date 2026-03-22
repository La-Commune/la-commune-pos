"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Check,
  AlertCircle,
  Delete,
  ChevronLeft,
  Coffee,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

// ── Helpers ──
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Clock Component ──
function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="text-text-25 tabular-nums"
      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "0.85rem" }}
    >
      {time}
    </span>
  );
}

// ── PIN Pad (Main view) ──
function PinView({
  onSwitchToCredentials,
}: {
  onSwitchToCredentials: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleKey = useCallback(
    (key: string, e?: React.MouseEvent) => {
      if (isLoading || success || verifying) return;

      // Ripple
      if (e) {
        const btn = e.currentTarget as HTMLElement;
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const ripple = document.createElement("span");
        ripple.className = "login-ripple";
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      }

      if (key === "del") {
        setPin((prev) => prev.slice(0, -1));
        setError(false);
      } else if (pin.length < 4) {
        const newPin = pin + key;
        setPin(newPin);
        setError(false);

        if (newPin.length === 4) {
          // Auto-submit on 4 digits
          setTimeout(async () => {
            setVerifying(true);
            const ok = await login(`pin:${newPin}`, newPin);
            setVerifying(false);
            if (ok) {
              setSuccess(true);
              setTimeout(() => router.push("/"), 1200);
            } else {
              setError(true);
              setTimeout(() => {
                setPin("");
                setError(false);
              }, 800);
            }
          }, 200);
        }
      }
    },
    [pin, isLoading, success, verifying, login, router]
  );

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") handleKey(e.key);
      else if (e.key === "Backspace") handleKey("del");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "ok"];

  return (
    <div className="login-panel-enter flex flex-col items-center">
      {/* Indicadores editorial: dot + línea base */}
      <div
        className={`flex gap-6 mb-4 ${error ? "login-shake" : ""}`}
      >
        {[0, 1, 2, 3].map((i) => {
          const filled = i < pin.length;
          const isError = error;
          const isSuccess = success;
          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              {/* Dot */}
              <div
                className="pin-indicator-dot"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  transform: filled ? "scale(1)" : "scale(0)",
                  opacity: filled ? 1 : 0,
                  background: isSuccess
                    ? "var(--ok)"
                    : isError
                    ? "var(--err)"
                    : "var(--text-100)",
                  transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s, background 0.2s",
                  ...(verifying ? {
                    animation: "login-verifying-dot 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                    transform: "scale(1)",
                    opacity: 1,
                    background: "var(--accent)",
                  } : {}),
                }}
              />
              {/* Línea base */}
              <div
                style={{
                  width: 32,
                  height: 2,
                  borderRadius: 1,
                  background: isSuccess
                    ? "var(--ok)"
                    : isError
                    ? "var(--err)"
                    : filled
                    ? "var(--text-100)"
                    : "var(--border)",
                  transform: filled ? "scaleX(1)" : "scaleX(0.5)",
                  opacity: isError ? 0.8 : 1,
                  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s, opacity 0.2s",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Status */}
      <p
        className="mb-8 h-5 transition-all duration-300"
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "0.75rem",
          fontWeight: 400,
          letterSpacing: "0.08em",
          color: success
            ? "var(--ok)"
            : error
            ? "var(--err)"
            : verifying
            ? "var(--text-45)"
            : "var(--text-25)",
        }}
      >
        {success
          ? "¡Bienvenido!"
          : error
          ? "PIN incorrecto"
          : verifying
          ? "Verificando..."
          : "Ingresa tu PIN"}
      </p>

      {/* Numpad — sin bordes, bold, tablet-friendly */}
      <div
        className="grid grid-cols-3"
        style={{ width: 320, gap: 6 }}
      >
        {keys.map((key) => {
          const isAction = key === "del" || key === "ok";
          if (key === "ok") {
            return <div key={key} style={{ height: 76 }} />;
          }
          return (
            <button
              key={key}
              type="button"
              onClick={(e) => handleKey(key, e)}
              disabled={success || verifying}
              className="login-pin-key flex items-center justify-center rounded-full cursor-pointer select-none active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                height: 76,
                background: "transparent",
                border: "none",
                fontFamily: isAction
                  ? "'Sora', sans-serif"
                  : "'Cormorant Garamond', serif",
                fontSize: isAction ? "0.7rem" : "2rem",
                fontWeight: isAction ? 400 : 500,
                color: isAction ? "var(--text-25)" : "var(--text-100)",
                letterSpacing: "-0.01em",
                transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.1s",
              }}
            >
              {key === "del" ? (
                <Delete size={24} className="text-text-35" strokeWidth={1.5} />
              ) : (
                key
              )}
            </button>
          );
        })}
      </div>

      {/* Switch to credentials */}
      <button
        type="button"
        onClick={onSwitchToCredentials}
        className="mt-10 flex items-center gap-2 text-text-25 hover:text-accent transition-colors duration-300 group"
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "0.78rem",
          fontWeight: 400,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <Mail size={14} strokeWidth={1.5} />
        Usar credenciales
        <ArrowRight
          size={13}
          className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
        />
      </button>
    </div>
  );
}

// ── Credentials View (Secondary) ──
function CredentialsView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const { login, error, clearError } = useAuthStore();
  const router = useRouter();

  const emailValid = emailRegex.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!emailValid) {
      useAuthStore.setState({ error: "Ingresa un email válido" });
      return;
    }
    if (password.length < 6) {
      useAuthStore.setState({ error: "Mínimo 6 caracteres" });
      return;
    }

    setSubmitState("loading");
    const success = await login(email, password);
    if (success) {
      setSubmitState("success");
      setTimeout(() => router.push("/"), 1200);
    } else {
      setSubmitState("idle");
    }
  };

  return (
    <div className="login-panel-enter w-full max-w-[380px]">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-text-25 hover:text-accent transition-colors duration-300 mb-8 group"
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: "0.78rem",
          fontWeight: 400,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <ChevronLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform duration-300"
        />
        Volver al PIN
      </button>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 px-4 py-3 mb-5 rounded-xl"
          style={{
            background: "var(--err-bg)",
            border: "1px solid rgba(176,101,101,0.2)",
            animation: "login-shake 0.5s cubic-bezier(0.36,0.07,0.19,0.97)",
          }}
        >
          <AlertCircle size={15} style={{ color: "var(--err)", flexShrink: 0 }} />
          <p
            className="text-xs"
            style={{ color: "var(--err)", fontFamily: "'Sora', sans-serif" }}
          >
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Email */}
        <div className="mb-4">
          <label
            htmlFor="login-email"
            className="text-text-45 uppercase tracking-widest block mb-2"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "0.68rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-25 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="tu@lacommune.mx"
              autoComplete="email"
              disabled={submitState !== "idle"}
              className="login-input w-full py-3 pl-10 pr-4 rounded-xl border-[1.5px] bg-surface-1 text-text-100 placeholder:text-text-25 outline-none transition-all duration-300 disabled:opacity-50"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "0.85rem",
                borderColor: "var(--border)",
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label
            htmlFor="login-password"
            className="text-text-45 uppercase tracking-widest block mb-2"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "0.68rem",
              fontWeight: 500,
              letterSpacing: "0.1em",
            }}
          >
            Contraseña
          </label>
          <div className="relative">
            <Lock
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-25 pointer-events-none"
              strokeWidth={1.5}
            />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitState !== "idle"}
              className="login-input w-full py-3 pl-10 pr-11 rounded-xl border-[1.5px] bg-surface-1 text-text-100 placeholder:text-text-25 outline-none transition-all duration-300 disabled:opacity-50"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: "0.85rem",
                borderColor: "var(--border)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar" : "Mostrar"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-surface-3 transition-colors"
            >
              {showPassword ? (
                <EyeOff size={17} className="text-text-25" strokeWidth={1.5} />
              ) : (
                <Eye size={17} className="text-text-25" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitState !== "idle"}
          className="login-btn-submit w-full py-3.5 rounded-xl border-none cursor-pointer disabled:cursor-not-allowed"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "var(--surface-0)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          {submitState === "idle" && (
            <span className="flex items-center justify-center gap-2">
              Iniciar Sesión
              <ArrowRight size={17} />
            </span>
          )}
          {submitState === "loading" && (
            <span className="flex items-center justify-center">
              <div className="login-spinner" />
            </span>
          )}
          {submitState === "success" && (
            <span className="flex items-center justify-center gap-2">
              <Check size={20} strokeWidth={2.5} />
              ¡Bienvenido!
            </span>
          )}
        </button>
      </form>
    </div>
  );
}

// ── Main Login Page ──
export default function LoginPage() {
  const [view, setView] = useState<"pin" | "credentials">("pin");

  return (
    <div className="min-h-screen bg-surface-0 relative overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Single soft orb behind the numpad area */}
        <div
          className="login-orb"
          style={{
            width: 500,
            height: 500,
            background: "var(--accent-soft)",
            top: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            animationDuration: "25s",
            opacity: 0.5,
          }}
        />
        <div
          className="login-orb"
          style={{
            width: 350,
            height: 350,
            background: "rgba(99, 60, 196, 0.06)",
            bottom: "-10%",
            right: "-5%",
            animationDuration: "20s",
            animationDelay: "-7s",
          }}
        />
      </div>

      {/* Noise */}
      <div className="login-noise fixed inset-0 z-[1] opacity-[0.025] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Top: Brand */}
        <div
          className="text-center mb-10"
          style={{
            animation: "login-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s both",
          }}
        >
          {/* Logo icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 border"
            style={{
              background: "var(--accent-soft)",
              borderColor: "var(--accent-mid)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <Coffee size={26} className="text-accent" strokeWidth={1.5} />
          </div>

          <h1
            className="text-text-100 leading-none tracking-tight"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(2.2rem, 4vw, 3rem)",
            }}
          >
            La <em className="italic font-normal text-accent">Commune</em>
          </h1>
          <p
            className="text-text-25 mt-2"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: "0.75rem",
              fontWeight: 300,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Punto de Venta
          </p>
        </div>

        {/* Center: PIN or Credentials */}
        <div
          style={{
            animation: "login-card-appear 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both",
          }}
        >
          {view === "pin" ? (
            <PinView onSwitchToCredentials={() => setView("credentials")} />
          ) : (
            <CredentialsView onBack={() => setView("pin")} />
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-4"
        style={{
          animation: "login-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s both",
        }}
      >
        <p
          className="text-text-25"
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "0.68rem",
            fontWeight: 300,
          }}
        >
          La Commune © 2026
        </p>
        <LiveClock />
      </div>
    </div>
  );
}
