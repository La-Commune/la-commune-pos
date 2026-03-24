"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover, fadeUp, timing, ease } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════
 * MotionCard — Card with built-in hover/tap micro-interactions
 *
 * Replaces static <div>/<button> cards across the POS with
 * premium scale + shadow feedback. Uses variants from motion.ts.
 * ══════════════════════════════════════════════════════════════ */

interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  /** Enable hover/tap animations (default true) */
  interactive?: boolean;
  /** Disable stagger-child entry animation */
  noEntry?: boolean;
  /** Make it a button (adds cursor-pointer) */
  as?: "div" | "button";
  onClick?: () => void;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  function MotionCard(
    {
      children,
      className,
      interactive = true,
      noEntry = false,
      as = "div",
      onClick,
      ...motionProps
    },
    ref,
  ) {
    const isButton = as === "button" || !!onClick;

    return (
      <motion.div
        ref={ref}
        variants={noEntry ? undefined : fadeUp}
        initial={noEntry ? undefined : "hidden"}
        animate={noEntry ? undefined : "show"}
        whileHover={interactive ? cardHover.hover : undefined}
        whileTap={interactive && isButton ? cardHover.tap : undefined}
        onClick={onClick}
        role={isButton ? "button" : undefined}
        tabIndex={isButton ? 0 : undefined}
        className={cn(isButton && "cursor-pointer", className)}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  },
);

/* ══════════════════════════════════════════════════════════════
 * StaggerGrid — Wraps a grid/list and staggers children entry
 * ══════════════════════════════════════════════════════════════ */

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  /** Delay between children in seconds */
  staggerDelay?: number;
  /** Initial delay before first child */
  startDelay?: number;
  /** Aria label for loading state */
  ariaLabel?: string;
}

export function StaggerGrid({
  children,
  className,
  staggerDelay = 0.06,
  startDelay = 0.04,
  ariaLabel,
}: StaggerGridProps) {
  return (
    <motion.div
      className={className}
      role={ariaLabel ? "status" : undefined}
      aria-label={ariaLabel}
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: startDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
 * MotionItem — Simple wrapper for stagger children
 * ══════════════════════════════════════════════════════════════ */

interface MotionItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export function MotionItem({ children, className, ...motionProps }: MotionItemProps) {
  return (
    <motion.div
      variants={fadeUp}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
