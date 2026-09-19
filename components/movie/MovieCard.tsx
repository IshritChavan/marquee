"use client";

import { Star } from "lucide-react";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";
import type { Title } from "@/types/movie";

/**
 * One poster card in the filmography grid.
 * Input:  a Title + click handler     Output: a button (opens the movie modal)
 * Hover: the poster lifts and its overview slides up over a soft scrim — information on demand,
 * without cluttering the resting state.
 */
export function MovieCard({ title, onOpen }: { title: Title; onOpen: (title: Title) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(title)}
      className="group block w-full text-left"
      aria-label={`${title.title}${title.year ? `, ${title.year}` : ""}. Open details`}
    >
      <span className="relative block aspect-[2/3] overflow-hidden rounded-2xl bg-panel transition-[transform,box-shadow] duration-500 ease-[var(--ease-cine)] group-hover:-translate-y-1.5 group-hover:shadow-[0_30px_50px_-25px_rgba(0,0,0,0.9)] group-focus-visible:-translate-y-1.5">
        <TmdbImage
          path={title.posterPath}
          size="w342"
          alt=""
          sizes="(min-width: 1280px) 220px, (min-width: 1024px) 18vw, (min-width: 768px) 24vw, 45vw"
          kind="poster"
          className="transition-transform duration-700 ease-[var(--ease-cine)] group-hover:scale-[1.04]"
        />
        {title.mediaType === "tv" && (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-bone backdrop-blur-md">TV</span>
        )}
        {title.overview && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 hidden translate-y-2 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 pb-4 pt-14 opacity-0 transition-all duration-500 ease-[var(--ease-cine)] group-hover:translate-y-0 group-hover:opacity-100 md:block"
          >
            <span className="line-clamp-4 text-[0.8rem] leading-relaxed text-bone/90">{title.overview}</span>
          </span>
        )}
      </span>

      <span className="mt-3.5 block">
        <span className="block truncate text-[1.02rem] text-bone">{title.title}</span>
        <span className="mt-0.5 block truncate text-sm text-dim">
          {[title.year, title.character ? `as ${title.character}` : null].filter(Boolean).join(" · ")}
        </span>
        <span className="mt-2 flex items-center gap-3 text-sm text-mist">
          {title.rating !== null ? (
            <span className="flex items-center gap-1 text-ice">
              <Star className="size-3.5 fill-current" strokeWidth={0} />
              {title.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-dim">Unrated</span>
          )}
          {title.revenue !== null && <span>{formatCompactCurrency(title.revenue)}</span>}
          {title.genres[0] && <span className="truncate text-dim">{title.genres[0]}</span>}
        </span>
      </span>
    </button>
  );
}
