"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Star, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";
import { formatLongDate, formatRuntime } from "@/lib/utils/formatDate";
import type { MovieExtras, Title } from "@/types/movie";

type ExtrasState =
  | { status: "loading" }
  | { status: "ready"; extras: MovieExtras }
  | { status: "error" };

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-dim">{label}</dt>
      <dd className="mt-1 text-bone">{value}</dd>
    </div>
  );
}

/**
 * Movie detail dialog.
 *
 * Uses the native <dialog> element opened with showModal(): the browser provides the focus trap,
 * Escape-to-close and the inert background for free.
 *
 * Data: the Title we already have renders instantly. Extras (runtime, budget, director, IMDb /
 * Rotten Tomatoes / Metascore) are fetched lazily from /api/movie/[id] when the dialog opens.
 * The parent mounts this component fresh per film (key={title.key}), so `loading` is the initial state.
 */
export function MovieModal({ title, onClose }: { title: Title; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isMovie = title.mediaType === "movie";
  const [extras, setExtras] = useState<ExtrasState>({ status: "loading" });

  // Open the native dialog and lock page scroll while it's open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  // Lazy fetch of extras (movies only — TV titles have no /api/movie equivalent).
  useEffect(() => {
    if (!isMovie) return;
    const controller = new AbortController();
    fetch(`/api/movie/${title.id}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as MovieExtras;
      })
      .then((data) => setExtras({ status: "ready", extras: data }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setExtras({ status: "error" });
      });
    return () => controller.abort();
  }, [isMovie, title.id]);

  const ready = extras.status === "ready" ? extras.extras : null;
  const runtime = formatRuntime(ready?.runtime ?? title.runtime);
  const revenue = ready?.revenue ?? title.revenue;
  const budget = ready?.budget ?? title.budget;
  const director = ready?.director ?? title.director;
  const ratings = ready?.ratings ?? null;
  const imdbId = ready?.imdbId ?? title.imdbId;
  const externalHref = imdbId
    ? `https://www.imdb.com/title/${imdbId}/`
    : `https://www.themoviedb.org/${title.mediaType}/${title.id}`;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // A click on the dialog element itself (not its content) is a click on the backdrop.
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      aria-labelledby={`modal-title-${title.key}`}
      className="m-auto max-h-[92dvh] w-[min(56rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[2rem] bg-panel p-0 text-bone shadow-[0_50px_120px_-20px_rgba(0,0,0,0.9)] backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <motion.div initial={{ opacity: 0, y: 14, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
        {/* Backdrop banner */}
        <div className="relative h-44 overflow-hidden bg-well sm:h-64">
          <TmdbImage path={title.backdropPath ?? title.posterPath} size="w780" alt="" sizes="900px" kind="backdrop" quiet className="opacity-60" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-black/50 text-bone backdrop-blur-md transition-colors hover:bg-black/75"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="relative -mt-20 grid gap-8 px-6 pb-10 sm:-mt-28 sm:grid-cols-[11rem_1fr] sm:px-10">
          <div className="relative mx-auto aspect-[2/3] w-36 overflow-hidden rounded-2xl bg-lift shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] sm:mx-0 sm:w-full">
            <TmdbImage path={title.posterPath} size="w342" alt={`${title.title} poster`} sizes="176px" kind="poster" />
          </div>

          <div className="min-w-0 sm:pt-28">
            <h2 id={`modal-title-${title.key}`} className="font-display text-4xl leading-tight sm:text-5xl">
              {title.title}
            </h2>
            <p className="mt-2 text-mist">
              {[title.year, title.mediaType === "tv" ? "TV" : ratings?.rated, runtime, title.genres.slice(0, 3).join(", ")]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {ready?.tagline && <p className="mt-3 font-display text-xl italic text-mist">{ready.tagline}</p>}

            {/* Ratings row */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-4">
              <div>
                <p className="text-sm text-dim">TMDB</p>
                <p className="mt-1 flex items-center gap-1.5 text-2xl text-bone">
                  {title.rating !== null ? (
                    <>
                      <Star className="size-5 fill-ice text-ice" strokeWidth={0} />
                      {title.rating.toFixed(1)}
                    </>
                  ) : (
                    <span className="text-dim">—</span>
                  )}
                </p>
              </div>
              {isMovie && extras.status === "loading" && <Skeleton className="h-12 w-44 rounded-xl" />}
              {ratings?.imdbRating != null && (
                <div>
                  <p className="text-sm text-dim">IMDb</p>
                  <p className="mt-1 text-2xl text-bone">{ratings.imdbRating.toFixed(1)}</p>
                </div>
              )}
              {ratings?.rottenTomatoes != null && (
                <div>
                  <p className="text-sm text-dim">Rotten Tomatoes</p>
                  <p className="mt-1 text-2xl text-bone">{ratings.rottenTomatoes}%</p>
                </div>
              )}
              {ratings?.metascore != null && (
                <div>
                  <p className="text-sm text-dim">Metascore</p>
                  <p className="mt-1 text-2xl text-bone">{ratings.metascore}</p>
                </div>
              )}
            </div>

            <p className="mt-7 max-w-2xl leading-relaxed text-mist">
              {title.overview || "No synopsis is available for this title."}
            </p>

            <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
              {title.character && <Stat label="Role" value={title.character} />}
              {director && <Stat label="Director" value={director} />}
              {title.releaseDate && <Stat label="Released" value={formatLongDate(title.releaseDate)} />}
              {revenue !== null && <Stat label="Worldwide gross" value={formatCompactCurrency(revenue)} />}
              {budget !== null && <Stat label="Budget" value={formatCompactCurrency(budget)} />}
              {title.episodeCount !== null && <Stat label="Episodes" value={String(title.episodeCount)} />}
            </dl>

            {ratings?.awardsSummary && <p className="mt-6 text-sm text-dim">{ratings.awardsSummary}</p>}
            {extras.status === "error" && (
              <p className="mt-6 text-sm text-dim">Extra details (runtime, IMDb and Rotten Tomatoes scores) couldn&apos;t be loaded.</p>
            )}

            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] px-5 py-2.5 text-sm text-bone transition-colors hover:bg-white/[0.13]"
            >
              {imdbId ? "View on IMDb" : "View on TMDB"}
              <ArrowUpRight className="size-3.5 text-dim" strokeWidth={1.75} />
            </a>
          </div>
        </div>
      </motion.div>
    </dialog>
  );
}
