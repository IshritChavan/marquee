"use client";

import Link from "next/link";

/** Last-resort boundary for anything unexpected. Expected failures (rate limits, missing data) are handled closer to the source. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[80svh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="font-display text-4xl text-bone">Something went wrong</h1>
      <p className="mt-4 leading-relaxed text-mist">An unexpected error interrupted this page. Try again, or head back home.</p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-white/[0.08] px-6 py-3 text-bone transition-colors hover:bg-white/[0.14]"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full px-6 py-3 text-mist transition-colors hover:text-bone">
          Home
        </Link>
      </div>
    </main>
  );
}
