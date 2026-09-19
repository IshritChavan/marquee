"use client";

import { MotionConfig } from "framer-motion";

/** App-wide client providers. `reducedMotion="user"` makes every animation respect the OS setting. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
