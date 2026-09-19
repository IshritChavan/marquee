import { EmptyState } from "@/components/ui/EmptyState";
import { tallyAwards } from "@/lib/analytics";
import { AWARD_BODIES, type AwardsResult } from "@/types/award";
import { AwardList } from "./AwardList";

/**
 * Awards, grouped by ceremony.
 * Input:  AwardsResult (from whichever AwardsProvider is configured — the UI never knows which)
 * Output: a panel per ceremony that has entries, plus an honest note about where the data came from.
 */
export function AwardsSection({ awards }: { awards: AwardsResult }) {
  if (awards.status === "unavailable" || awards.awards.length === 0) {
    return (
      <EmptyState
        title="No awards data for this actor"
        body={
          awards.note ??
          "The current awards source doesn't cover this person. A real awards provider can be plugged in from lib/api/awards.ts."
        }
      />
    );
  }

  const withEntries = AWARD_BODIES.filter((body) => awards.awards.some((a) => a.body === body.id));
  const withoutEntries = AWARD_BODIES.filter((body) => !awards.awards.some((a) => a.body === body.id));

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2">
        {withEntries.map((body) => {
          const entries = awards.awards.filter((a) => a.body === body.id);
          const tally = tallyAwards(entries);
          const complete = awards.completeBodies.includes(body.id);
          return (
            <article key={body.id} className="rounded-[2rem] bg-panel/60 p-3 sm:p-4">
              <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 pb-4 pt-4">
                <h3 className="font-display text-3xl text-bone">{body.label}</h3>
                <p className="text-sm text-mist">
                  {tally.wins > 0 && (
                    <span className="text-gilt">
                      {tally.wins} {tally.wins === 1 ? "win" : "wins"}
                    </span>
                  )}
                  {tally.wins > 0 && complete && <span className="text-dim"> · </span>}
                  {complete ? (
                    <span>
                      {tally.nominations} {tally.nominations === 1 ? "nomination" : "nominations"}
                    </span>
                  ) : (
                    <span className="text-dim">{tally.wins > 0 ? " · " : ""}notable wins only</span>
                  )}
                </p>
              </header>
              <AwardList awards={entries} />
            </article>
          );
        })}
      </div>

      {withoutEntries.length > 0 && (
        <p className="mt-6 text-sm text-dim">
          No entries on file for {withoutEntries.map((b) => b.label).join(", ")}.
        </p>
      )}
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-dim">
        Source: {awards.source}
        {awards.note ? `. ${awards.note}` : "."}
      </p>
    </div>
  );
}
