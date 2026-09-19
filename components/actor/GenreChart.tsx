"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { GENRE_COLORS, OTHER_COLOR } from "@/lib/theme";
import type { GenreSlice } from "@/types/analytics";

function colorFor(slice: GenreSlice, index: number): string {
  return slice.isOther ? OTHER_COLOR : GENRE_COLORS[index % GENRE_COLORS.length];
}

/**
 * Donut of genre shares + a matching legend. Hovering either one highlights the same slice.
 * Input:  GenreSlice[] (shares already sum to exactly 100)
 */
export function GenreChart({ distribution, totalFilms }: { distribution: GenreSlice[]; totalFilms: number }) {
  const [active, setActive] = useState<number | null>(null);

  if (distribution.length === 0) {
    return <EmptyState title="No genre data" body="TMDB hasn't tagged these films with genres." />;
  }

  // "Other" is a bucket, not a genre, so it isn't counted in the centre label.
  const namedGenres = distribution.filter((slice) => !slice.isOther).length;
  const hasOther = namedGenres < distribution.length;

  return (
    <div className="grid items-center gap-10 sm:grid-cols-[minmax(0,15rem)_1fr]">
      <div className="relative mx-auto aspect-square w-full max-w-[15rem]" onMouseLeave={() => setActive(null)}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 240, height: 240 }}>
          <PieChart>
            <Pie
              data={distribution}
              dataKey="films"
              nameKey="name"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={2}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              isAnimationActive
              animationDuration={1000}
              onMouseEnter={(_, index) => setActive(index)}
            >
              {distribution.map((slice, i) => (
                <Cell
                  key={slice.name}
                  fill={colorFor(slice, i)}
                  fillOpacity={active === null || active === i ? 1 : 0.28}
                  style={{ transition: "fill-opacity 250ms", outline: "none" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-5xl leading-none text-bone">
            {active === null ? namedGenres : `${distribution[active].share}%`}
          </span>
          <span className="mt-1 text-sm text-dim">
            {active === null ? (hasOther ? "top genres" : namedGenres === 1 ? "genre" : "genres") : distribution[active].name}
          </span>
        </div>
      </div>

      <ul className="space-y-1" aria-label={`Genre share across ${totalFilms} films`}>
        {distribution.map((slice, i) => (
          <li
            key={slice.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`flex items-center gap-4 rounded-xl px-3 py-2.5 transition-opacity duration-200 ${
              active !== null && active !== i ? "opacity-40" : ""
            }`}
          >
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: colorFor(slice, i) }} />
            <span className="flex-1 text-bone">{slice.name}</span>
            <span className="text-sm text-dim">{slice.films} films</span>
            <span className="w-12 text-right tabular-nums text-mist">{slice.share}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
