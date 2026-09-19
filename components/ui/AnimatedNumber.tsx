"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";

export type NumberKind = "integer" | "decimal" | "currency";

function format(value: number, kind: NumberKind): string {
  switch (kind) {
    case "integer":
      return Math.round(value).toLocaleString("en-US");
    case "decimal":
      return value.toFixed(1);
    case "currency":
      // formatCompactCurrency returns "—" for 0, which is what we'd show on the first frame.
      return value <= 0 ? "$0" : formatCompactCurrency(value);
  }
}

/**
 * Counts up from 0 to `value` the first time it scrolls into view.
 * Props are plain data (no functions) so this can be used from Server Components.
 * Screen readers get the final value immediately via the hidden text.
 */
export function AnimatedNumber({
  value,
  kind = "integer",
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  kind?: NumberKind;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => format(0, kind));

  useEffect(() => {
    // With reduced motion there is nothing to animate: the final value is rendered directly below.
    if (!inView || reduceMotion) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(format(latest, kind)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, kind, duration]);

  const shown = reduceMotion ? format(value, kind) : display;

  return (
    <span ref={ref}>
      <span className="sr-only">
        {format(value, kind)}
        {suffix}
      </span>
      <span aria-hidden="true" className="tabular-nums">
        {shown}
        {suffix}
      </span>
    </span>
  );
}
