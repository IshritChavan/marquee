import { TmdbImage } from "@/components/ui/TmdbImage";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CareerHighlight } from "@/types/analytics";

/**
 * Calculated career "headlines" (career high, biggest hit, favourite genre …).
 * The text is generated in lib/analytics/actorAnalytics.ts — this component only lays it out.
 * Highlights that come from a film show its poster; genre / decade ones don't need one.
 */
export function CareerHighlights({ highlights }: { highlights: CareerHighlight[] }) {
  if (highlights.length === 0) {
    return <EmptyState title="Not enough data for highlights yet" body="Highlights appear once there are a few rated films." />;
  }

  return (
    <ul className="grid gap-x-10 gap-y-2 md:grid-cols-2">
      {highlights.map((h) => (
        <li key={h.id} className="flex items-center gap-5 border-t border-white/[0.07] py-6">
          {h.posterPath && (
            <span className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-panel">
              <TmdbImage path={h.posterPath} size="w154" alt="" sizes="56px" kind="poster" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm text-dim">{h.label}</p>
            <p className="mt-1 font-display text-3xl leading-tight text-bone">{h.headline}</p>
            <p className="mt-1 text-sm text-mist">{h.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
