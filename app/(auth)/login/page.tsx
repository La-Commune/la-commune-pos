"use client";

import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Supabase Auth integration
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-lg bg-accent-mid flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="font-display text-accent text-2xl">LC</span>
          </div>
          <h1 className="font-display text-2xl text-text-100">La Commune</h1>
          <p className="text-text-45 text-sm mt-1">Punto de Venta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-70 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barista@lacommune.mx"
              required
              className="w-full px-3 py-2.5 rounded-md bg-surface-1 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:bg-surface-2 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-70 mb-1.5">
              Contrasena
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 rounded-md bg-surface-1 border border-border text-text-100 text-sm placeholder:text-text-25 focus:outline-none focus:border-accent focus:bg-surface-2 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-45 hover:text-text-70"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md btn-primary text-sm disabled:opacity-50"
          >
            <LogIn size={16} />
            {isLoading ? "Entrando..." : "Iniciar sesion"}
          </button>
        </form>

        <p className="text-center text-text-25 text-xs mt-8">
          La Commune &middot; Mineral de la Reforma, MX
        </p>
      </div>
    </div>
  );
}
