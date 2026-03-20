"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

/* ──────────────────────────────────────
   Input reutilizable — POS La Commune
   Reemplaza inputs inline inconsistentes.
   ────────────────────────────────────── */

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Icono a la izquierda (componente React, ej. <Search size={16} />) */
  icon?: React.ReactNode;
  /** Muestra borde de error */
  error?: boolean;
  /** Variante de tamaño */
  variant?: "default" | "sm" | "lg";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, error, variant = "default", type, ...props }, ref) => {
    const sizes = {
      sm: "py-2 text-xs min-h-[36px]",
      default: "py-2.5 text-sm min-h-[44px]",
      lg: "py-3.5 text-sm min-h-[48px]",
    };

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-25 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full rounded-xl border bg-surface-2 text-text-100",
            "placeholder:text-text-25 outline-none transition-all duration-300",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            sizes[variant],
            icon ? "pl-9 pr-3" : "px-3",
            error
              ? "border-status-err focus:border-status-err focus:ring-status-err/20"
              : "border-border",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

/* ──────────────────────────────────────
   Select reutilizable
   ────────────────────────────────────── */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  variant?: "default" | "sm" | "lg";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, variant = "default", children, ...props }, ref) => {
    const sizes = {
      sm: "py-2 text-xs min-h-[36px]",
      default: "py-2.5 text-sm min-h-[44px]",
      lg: "py-3.5 text-sm min-h-[48px]",
    };

    return (
      <select
        ref={ref}
        className={cn(
          "w-full px-3 rounded-xl border bg-surface-2 text-text-100",
          "outline-none transition-all duration-300",
          "focus:border-accent focus:ring-2 focus:ring-accent/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizes[variant],
          error
            ? "border-status-err focus:border-status-err focus:ring-status-err/20"
            : "border-border",
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

/* ──────────────────────────────────────
   Textarea reutilizable
   ────────────────────────────────────── */

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2.5 rounded-xl border bg-surface-2 text-text-100 text-sm",
        "placeholder:text-text-25 outline-none transition-all duration-300 resize-none",
        "focus:border-accent focus:ring-2 focus:ring-accent/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        error
          ? "border-status-err focus:border-status-err focus:ring-status-err/20"
          : "border-border",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
