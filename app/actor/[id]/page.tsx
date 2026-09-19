import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActorError } from "@/components/actor/ActorError";
import { ActorHero } from "@/components/actor/ActorHero";
import { AwardsSection } from "@/components/actor/AwardsSection";
import { BoxOfficeChart } from "@/components/actor/BoxOfficeChart";
import { CareerHighlights } from "@/components/actor/CareerHighlights";
import { CareerRatingChart } from "@/components/actor/CareerRatingChart";
import { CareerTimeline } from "@/components/actor/CareerTimeline";
import { Collaborators } from "@/components/actor/Collaborators";
import { Filmography } from "@/components/actor/Filmography";
import { GenreChart } from "@/components/actor/GenreChart";
import { InsightStat } from "@/components/actor/InsightStat";
import { ProfileSection } from "@/components/actor/ProfileSection";
import { StatsGrid } from "@/components/actor/StatsGrid";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getActorProfile } from "@/lib/services/actorService";
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";
import { isAppError, type AppErrorCode } from "@/lib/utils/errors";
import { parseId } from "@/lib/utils/apiResponse";
import type { ActorProfile } from "@/types/actor";

// Next.js 16: route params arrive as a Promise and must be awaited.
type PageProps = { params: Promise<{ id: string }> };

/** Loads the profile, turning failures into a value the page can render instead of throwing. */
async function loadProfile(rawId: string): Promise<{ profile: ActorProfile } | { error: AppErrorCode }> {
  const id = parseId(rawId);
  if (id === null) notFound();
  try {
    return { profile: await getActorProfile(id) };
  } catch (err) {
    if (isAppError(err)) {
      if (err.code === "NOT_FOUND") notFound();
      return { error: err.code };
    }
    console.error("Actor page failed:", err instanceof Error ? err.message : err);
    return { error: "UPSTREAM" };
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const parsed = parseId(id);
  if (parsed === null) return { title: "Actor not found" };
  try {
    // Shares the cache with the page itself, so this costs nothing extra.
    const { actor, analytics } = await getActorProfile(parsed);
    const description = `${actor.name}'s career in numbers: ${analytics.counts.features} films, ratings, box office, genres, awards and collaborators.`;
    return {
      title: actor.name,
      description,
      // Without this, link previews would show the generic site title from the root layout.
      openGraph: { title: `${actor.name} · Marquee`, description, type: "profile" },
    };
  } catch {
    return { title: "Actor" };
  }
}

export default async function ActorPage({ params }: PageProps) {
  const { id } = await params;
  const result = await loadProfile(id);

  if ("error" in result) {
    return (
      <>
        <SiteHeader withSearch />
        <ActorError code={result.error} />
      </>
    );
  }

  const { actor, titles, analytics, awards, meta } = result.profile;
  const { ratings, revenue, genres, career, collaboration, counts } = analytics;

  return (
    <>
      <SiteHeader withSearch />
      <main>
        <ActorHero actor={actor} career={career} />
        <StatsGrid analytics={analytics} awards={awards} />

        {meta.warnings.length > 0 && (
          <div className="mx-auto mt-8 max-w-7xl px-5 sm:px-8">
            <p className="text-sm text-dim">{meta.warnings.join(" ")}</p>
          </div>
        )}

        <ProfileSection
          id="ratings"
          title="Career ratings"
          description="Every rated film, plotted by release date. The line shows how the average of recent work has moved."
        >
          <CareerRatingChart points={ratings.points} />
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4">
            <InsightStat
              label="Average rating"
              value={ratings.average !== null ? ratings.average.toFixed(1) : null}
              detail={ratings.median !== null ? `median ${ratings.median.toFixed(1)}` : undefined}
            />
            <InsightStat
              label="Highest rated"
              value={ratings.highest?.title ?? null}
              detail={ratings.highest ? `${ratings.highest.value.toFixed(1)}${ratings.highest.year ? ` · ${ratings.highest.year}` : ""}` : undefined}
            />
            <InsightStat
              label="Lowest rated"
              value={ratings.lowest?.title ?? null}
              detail={ratings.lowest ? `${ratings.lowest.value.toFixed(1)}${ratings.lowest.year ? ` · ${ratings.lowest.year}` : ""}` : undefined}
            />
            <InsightStat
              label="Best decade"
              value={ratings.bestDecade?.label ?? null}
              detail={ratings.bestDecade?.averageRating != null ? `average ${ratings.bestDecade.averageRating.toFixed(1)}` : undefined}
            />
          </dl>
        </ProfileSection>

        <ProfileSection
          id="box-office"
          title="Box office performance"
          description={
            counts.detailedFeatures > 0
              ? `Worldwide gross, nominal USD. Revenue is reported for ${counts.featuresWithRevenue} of the ${counts.detailedFeatures} films analysed in detail.`
              : "Worldwide gross, nominal USD."
          }
        >
          <div className="grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
            <BoxOfficeChart ranking={revenue.ranking} />
            <dl className="grid grid-cols-2 content-start gap-x-8 gap-y-9 lg:grid-cols-1">
              <InsightStat label="Total box office" value={revenue.total > 0 ? formatCompactCurrency(revenue.total) : null} />
              <InsightStat
                label="Average per film"
                value={revenue.average !== null ? formatCompactCurrency(revenue.average) : null}
              />
              <InsightStat
                label="Highest grossing"
                value={revenue.highest?.title ?? null}
                detail={revenue.highest ? formatCompactCurrency(revenue.highest.value) : undefined}
              />
              <InsightStat
                label="Best-performing decade"
                value={revenue.bestDecade?.label ?? null}
                detail={revenue.bestDecade ? `${formatCompactCurrency(revenue.bestDecade.totalRevenue)} total` : undefined}
              />
            </dl>
          </div>
        </ProfileSection>

        <ProfileSection
          id="genres"
          title="Genre distribution"
          description="How the filmography splits by genre. Films with several genres count toward each of them."
        >
          <div className="grid gap-14 lg:grid-cols-[1fr_20rem] lg:gap-20">
            <GenreChart distribution={genres.distribution} totalFilms={counts.features} />
            <dl className="grid grid-cols-1 content-start gap-y-9 sm:grid-cols-3 lg:grid-cols-1">
              <InsightStat
                label="Most common genre"
                value={genres.mostCommon?.name ?? null}
                detail={genres.mostCommon ? `${genres.mostCommon.films} films` : undefined}
              />
              <InsightStat
                label="Highest-rated genre"
                value={genres.highestRated?.name ?? null}
                detail={genres.highestRated?.averageRating != null ? `average ${genres.highestRated.averageRating.toFixed(1)}` : undefined}
              />
              <InsightStat
                label="Most commercially successful"
                value={genres.mostSuccessful?.name ?? null}
                detail={genres.mostSuccessful ? `${formatCompactCurrency(genres.mostSuccessful.totalRevenue)} total` : undefined}
              />
            </dl>
          </div>
        </ProfileSection>

        <ProfileSection
          id="awards"
          title="Awards"
          description="Wins and nominations at the major ceremonies."
        >
          <AwardsSection awards={awards} />
        </ProfileSection>

        <ProfileSection id="highlights" title="Career highlights" description="Calculated from the films above, not written by hand.">
          <CareerHighlights highlights={analytics.highlights} />
        </ProfileSection>

        <ProfileSection
          id="collaborators"
          title="Frequent collaborators"
          description="Directors and co-stars who keep coming back. The number is how many films they share."
        >
          <Collaborators collaborators={collaboration.frequent} detailedFilms={counts.detailedFeatures} />
        </ProfileSection>

        <ProfileSection id="timeline" title="Career timeline" description="The debut and the films that mattered most, in order.">
          <CareerTimeline entries={analytics.timeline} />
        </ProfileSection>

        <ProfileSection id="filmography" title="Filmography" description={`${meta.totalCredits} credits on TMDB.`}>
          <Filmography titles={titles} />
        </ProfileSection>
      </main>
      <SiteFooter />
    </>
  );
}
