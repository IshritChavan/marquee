"use client";

import { useState } from "react";

const CLAMP_AT = 420;

/**
 * Biography with a "Read more" toggle. Client component only because of the toggle state;
 * the full text is in the HTML either way (CSS clamps it), so search engines and screen readers see it all.
 */
export function Biography({ text, name }: { text: string | null; name: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return <p className="max-w-2xl text-base leading-relaxed text-dim">TMDB has no biography for {name} yet.</p>;
  }

  const long = text.length > CLAMP_AT;
  return (
    <div className="max-w-2xl">
      <p className={`text-base leading-[1.75] text-mist sm:text-[1.05rem] ${long && !expanded ? "line-clamp-5" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 text-sm text-ice transition-colors hover:text-bone"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
