"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { timing, ease } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════
 * LoadingButton — Button with integrated loading spinner
 *
 * Variants use CSS custom properties from the design system
 * so they adapt to all 5 POS themes automatically.
 * ══════════════════════════════════════════════════════════════ */

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={0.2} />
      <path d="M12 2C6.477 2 2 6.477 2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const variantClasses = {
  primary:
    "bg-accent text-white hover:brightness-110 border-transparent shadow-btn",
  secondary:
    "bg-surface-3 text-text-70 hover:text-text-100 border-border hover:border-border-hover",
  ghost:
    "bg-transparent text-text-45 hover:text-text-100 hover:bg-surface-2 border-transparent",
  danger:
    "bg-status-err text-white hover:brightness-110 border-transparent",
};

const sizeClasses = {
  sm: "text-xs px-3 py-1.5 gap-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 gap-2 rounded-xl",
  lg: "text-sm px-6 py-3 gap-2.5 rounded-xl font-medium",
};

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  variant = "primary",
  size = "md",
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || loading;
  const spinnerSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  return (
    <motion.button
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.015 }}
      whileTap={isDisabled ? undefined : { scale: 0.975 }}
      transition={{ duration: timing.fast, ease: ease.inOut }}
      className={cn(
        "inline-flex items-center justify-center font-medium border transition-colors duration-200",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && "opacity-50 cursor-not-allowed",
        className,
      )}
      {...(props as any)}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="inline-flex items-center gap-2"
          >
            <Spinner size={spinnerSize} />
            {loadingText && <span>{loadingText}</span>}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: timing.instant }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export { Spinner };
