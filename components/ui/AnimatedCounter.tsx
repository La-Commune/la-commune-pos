"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, useInView, useMotionValue } from "framer-motion";
import { timing, ease } from "@/lib/motion";

/* ══════════════════════════════════════════════════════════════
 * AnimatedCounter — Premium count-up animation
 *
 * Usage:
 *   <AnimatedCounter value={15000} format={(v) => formatMXN(v)} />
 *   <AnimatedCounter value={42} />
 * ══════════════════════════════════════════════════════════════ */

interface AnimatedCounterProps {
  /** Target numeric value */
  value: number;
  /** Format function (e.g., formatMXN) */
  format?: (value: number) => string;
  /** Duration in seconds */
  duration?: number;
  /** Delay before starting */
  delay?: number;
  /** CSS class for the displayed number */
  className?: string;
  /** Only animate when in viewport */
  animateOnView?: boolean;
}

export function AnimatedCounter({
  value,
  format,
  duration = timing.dramatic,
  delay = 0,
  className,
  animateOnView = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [displayValue, setDisplayValue] = useState("0");

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });

  useEffect(() => {
    const shouldAnimate = animateOnView ? isInView : true;
    if (!shouldAnimate) return;

    const timeout = setTimeout(() => {
      motionValue.set(value);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [value, isInView, animateOnView, delay, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      const rounded = Math.round(latest);
      setDisplayValue(format ? format(rounded) : String(rounded));
    });
    return unsubscribe;
  }, [springValue, format]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 4 }}
      animate={
        (animateOnView ? isInView : true)
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 4 }
      }
      transition={{ duration: timing.normal, ease: ease.out, delay }}
    >
      {displayValue}
    </motion.span>
  );
}

/* ── Simple fraction counter: "3 / 8" ── */
interface FractionCounterProps {
  numerator: number;
  denominator: number;
  className?: string;
}

export function FractionCounter({ numerator, denominator, className }: FractionCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState("0");

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 600, bounce: 0 });

  useEffect(() => {
    if (isInView) motionValue.set(numerator);
  }, [numerator, isInView, motionValue]);

  useEffect(() => {
    const unsub = springValue.on("change", (v) => setDisplay(String(Math.round(v))));
    return unsub;
  }, [springValue]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: timing.normal, ease: ease.out }}
    >
      {display} / {denominator}
    </motion.span>
  );
}
