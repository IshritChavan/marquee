"use client";

import { useState } from "react";
import type { Award } from "@/types/award";

const INITIAL_VISIBLE = 5;

/**
 * One ceremony's entries, newest first, wins ahead of nominations within a year.
 * Gilt is used only for wins — a quiet tint and a small dot — so a win reads at a glance
 * without turning the section into a trophy shelf.
 */
export function AwardList({ awards }: { awards: Award[] }) {
  const [showAll, setShowAll] = useState(false);

  const sorted = [...awards].sort(
    (a, b) => b.year - a.year || Number(b.outcome === "win") - Number(a.outcome === "win"),
  );
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_VISIBLE);

  return (
    <div>
      <ul className="space-y-1.5">
        {visible.map((award, i) => {
          const won = award.outcome === "win";
          return (
            <li
              key={`${award.year}-${award.category}-${award.work ?? ""}-${i}`}
              className={`grid grid-cols-[4.5rem_1fr] gap-x-4 rounded-2xl px-4 py-3.5 ${won ? "bg-gilt/[0.07]" : ""}`}
            >
              <div>
                <span className={`flex items-center gap-2 text-sm ${won ? "text-gilt" : "text-dim"}`}>
                  {won && <span aria-hidden="true" className="size-1.5 rounded-full bg-gilt" />}
                  {won ? "Won" : "Nominated"}
                </span>
                <span className="mt-0.5 block text-sm tabular-nums text-mist">{award.year}</span>
              </div>
              <div className="min-w-0">
                <p className="text-bone">{award.category}</p>
                {award.work && <p className="mt-0.5 truncate text-sm text-mist">{award.work}</p>}
              </div>
            </li>
          );
        })}
      </ul>
      {sorted.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-3 px-4 text-sm text-ice transition-colors hover:text-bone"
        >
          {showAll ? "Show fewer" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}
