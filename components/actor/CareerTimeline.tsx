import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TmdbImage } from "@/components/ui/TmdbImage";
import type { TimelineEntry } from "@/types/analytics";

/**
 * Vertical timeline of milestone films: the debut plus the highest-scoring films.
 * Highlighted entries (top quartile) get a poster and a brighter marker; the rest stay compact so
 * the eye lands on the important films first.
 */
export function CareerTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState title="No timeline yet" body="A timeline needs films with known release dates." />;
  }

  return (
    <ol className="relative">
      {/* The line itself. Centered on the marker column. */}
      <span aria-hidden="true" className="absolute bottom-3 left-[6.25rem] top-3 w-px bg-white/10 sm:left-[7.75rem]" />
      {entries.map((entry) => (
        <li key={entry.key} className="relative grid grid-cols-[4.5rem_2.5rem_1fr] items-start gap-x-2 py-5 sm:grid-cols-[5.5rem_2.5rem_1fr] sm:gap-x-4">
          <span
            className={`pt-0.5 text-right font-display leading-none ${
              entry.highlight ? "text-4xl text-bone" : "text-3xl text-dim"
            }`}
          >
            {entry.year}
          </span>
          <span aria-hidden="true" className="relative flex justify-center pt-2">
            <span
              className={`rounded-full ring-4 ring-canvas ${
                entry.highlight ? "size-3.5 bg-ice" : "size-2.5 translate-y-0.5 bg-stone"
              }`}
            />
          </span>
          <div className="flex min-w-0 items-start gap-5">
            {entry.highlight && (
              <span className="relative hidden aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-panel sm:block">
                <TmdbImage path={entry.posterPath} size="w154" alt="" sizes="64px" kind="poster" />
              </span>
            )}
            <div className="min-w-0">
              <p className={entry.highlight ? "text-xl text-bone" : "text-[1.02rem] text-mist"}>{entry.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-dim">
                {entry.isDebut && <span className="text-ice">Debut</span>}
                {entry.character && <span>as {entry.character}</span>}
                {entry.rating !== null && (
                  <span className="flex items-center gap-1">
                    <Star className="size-3 fill-current" strokeWidth={0} />
                    {entry.rating.toFixed(1)}
                  </span>
                )}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
