"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validación de email en cliente
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      useAuthStore.setState({ error: "Ingresa un email válido" });
      return;
    }

    if (password.length < 6) {
      useAuthStore.setState({ error: "La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.push("/mesas");
    }
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-[#7B6CE0] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-black/20">
            <span className="font-display text-white text-2xl">LC</span>
          </div>
          <h1 className="font-display text-2xl text-text-100 tracking-wide">La Commune</h1>
          <p className="text-text-25 text-sm mt-1">Punto de Venta</p>
        </div>

        {/* Card Wrapper */}
        <div className="bg-surface-1 border border-border rounded-2xl p-8 shadow-2xl shadow-black/30 mb-8">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg bg-status-err-bg border border-[rgba(168,96,96,0.2)]">
              <AlertCircle size={16} className="text-status-err flex-shrink-0" />
              <p className="text-xs text-status-err">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-medium text-text-25 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="barista@lacommune.mx"
                required
                disabled={isLoading}
                className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[11px] font-medium text-text-25 mb-1.5 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-border-hover transition-all duration-300 pr-10 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-25 hover:text-text-45 transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-primary text-[13px]"
            >
              <LogIn size={16} />
              {isLoading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>
        </div>

        <p className="text-center text-text-25 text-[11px] uppercase tracking-widest">
          La Commune &middot; Mineral de la Reforma
        </p>
      </div>
    </div>
  );
}
