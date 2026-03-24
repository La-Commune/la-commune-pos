/**
 * ══════════════════════════════════════════════════════════════
 *  Motion System — Animation tokens, presets & variants
 *  Centralizes all animation constants for the POS.
 *  Import these instead of hardcoding durations/easings.
 * ══════════════════════════════════════════════════════════════
 */
import type { Variants, Transition } from "framer-motion";

/* ─── Timing tokens ─── */
export const timing = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.25,
  smooth: 0.35,
  slow: 0.5,
  dramatic: 0.7,
} as const;

/* ─── Easing presets ─── */
export const ease = {
  /** Smooth deceleration — ideal for entrances */
  out: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Smooth acceleration — ideal for exits */
  in: [0.4, 0, 1, 1] as [number, number, number, number],
  /** Balanced — ideal for state transitions */
  inOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Springy overshoot — micro-interactions */
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
} as const;

/* ─── Spring configs ─── */
export const spring = {
  /** Snappy — buttons, toggles */
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  /** Gentle — cards, modals */
  gentle: { type: "spring" as const, stiffness: 260, damping: 24 },
  /** Bouncy — badges, counts */
  bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
} as const;

/* ─── Transition presets ─── */
export const transition = {
  /** Page-level transitions */
  page: { duration: timing.normal, ease: ease.out } as Transition,
  /** Cards entering */
  card: { duration: timing.smooth, ease: ease.out } as Transition,
  /** Quick feedback (hover, press) */
  micro: { duration: timing.fast, ease: ease.inOut } as Transition,
  /** Smooth state changes */
  smooth: { duration: timing.normal, ease: ease.inOut } as Transition,
} as const;

/* ─── Stagger container variants ─── */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/* ─── Child item variants ─── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: timing.smooth, ease: ease.out },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: timing.normal, ease: ease.out },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: timing.smooth, ease: ease.out },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: timing.smooth, ease: ease.out },
  },
};

/* ─── Interactive variants (hover/tap) ─── */
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
  },
  hover: {
    scale: 1.015,
    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    transition: { duration: timing.normal, ease: ease.out },
  },
  tap: {
    scale: 0.985,
    transition: { duration: timing.instant },
  },
} as const;

export const buttonPress = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: timing.fast, ease: ease.out },
  },
  tap: {
    scale: 0.97,
    transition: { duration: timing.instant },
  },
} as const;

/* ─── Number counter helper ─── */
export const counterTransition: Transition = {
  duration: timing.dramatic,
  ease: ease.out,
};

/* ─── Reduced motion check (client side) ─── */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
