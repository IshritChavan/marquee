import { MetricCard } from "@/components/ui/MetricCard";
import { Reveal } from "@/components/ui/Reveal";
import { tallyAwards } from "@/lib/analytics";
import type { ActorAnalytics } from "@/types/analytics";
import type { AwardsResult } from "@/types/award";

/**
 * The headline numbers directly under the hero.
 * Input:  analytics + awards        Output: six MetricCards in one connected band
 *
 * Honesty rule: a number we can't actually know is shown as "—", never as 0.
 *  - Oscar wins/nominations need an awards source that covers this person.
 *  - Nominations are only shown when the source is COMPLETE for the Academy (see `completeBodies`).
 */
export function StatsGrid({ analytics, awards }: { analytics: ActorAnalytics; awards: AwardsResult }) {
  const { counts, ratings, revenue, career } = analytics;

  const hasAwardData = awards.status !== "unavailable";
  const academy = tallyAwards(awards.awards, "academy");
  const academyComplete = awards.completeBodies.includes("academy");

  const oscarWins = hasAwardData ? academy.wins : null;
  const oscarNoms = hasAwardData && academyComplete ? academy.nominations : null;

  return (
    <Reveal className="mx-auto max-w-7xl px-5 sm:px-8">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-white/[0.06] lg:grid-cols-6">
        <div className="bg-panel">
          <MetricCard
            label="Films"
            value={counts.features}
            caption={counts.tvCredits > 0 ? `plus ${counts.tvCredits} TV credits` : undefined}
          />
        </div>
        <div className="bg-panel">
          <MetricCard
            label="Average rating"
            value={ratings.average}
            kind="decimal"
            caption={counts.ratedFeatures > 0 ? `across ${counts.ratedFeatures} rated films` : "not enough votes yet"}
          />
        </div>
        <div className="bg-panel">
          <MetricCard
            label="Box office"
            value={revenue.total > 0 ? revenue.total : null}
            kind="currency"
            caption={
              counts.featuresWithRevenue > 0 ? `from ${counts.featuresWithRevenue} films with reported grosses` : "no revenue reported"
            }
          />
        </div>
        <div className="bg-panel">
          <MetricCard
            label="Career"
            value={career.lengthYears > 0 ? career.lengthYears : null}
            suffix=" yrs"
            caption={career.startYear ? `since ${career.startYear}` : undefined}
          />
        </div>
        <div className="bg-panel">
          <MetricCard
            label="Oscar wins"
            value={oscarWins}
            tone={oscarWins ? "gilt" : "default"}
            caption={hasAwardData ? undefined : "no awards data for this actor"}
          />
        </div>
        <div className="bg-panel">
          <MetricCard label="Oscar nominations" value={oscarNoms} caption={oscarNoms === null && hasAwardData ? "not tracked" : undefined} />
        </div>
      </div>
    </Reveal>
  );
}
