"use client";

import { motion } from "framer-motion";

/**
 * Fades a section in once as it scrolls into view. Deliberately small (8px, 0.7s) — it should read
 * as the page "settling", not as bouncing content. Respects prefers-reduced-motion via MotionConfig.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
