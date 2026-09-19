/**
 * Actor-level analytics: the orchestrator.
 *
 * Input:  all of an actor's Titles + the credits (cast/directors) of the detailed films
 * Output: one `ActorAnalytics` object with everything the profile page displays
 *
 * It calls the focused modules (movieAnalytics, collaborationAnalytics) and adds the pieces that
 * are about the *career* as a whole: career length, and human-readable highlights.
 */
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";
import type { ActorAnalytics, CareerHighlight } from "@/types/analytics";
import type { Title, TitleCredits } from "@/types/movie";
import {
  averageRating,
  bestDecadeByRating,
  bestDecadeByRevenue,
  decadeStats,
  filmsPerYear,
  genreDistribution,
  genreStats,
  highestGrossing,
  highestRated,
  highestRatedGenre,
  lowestRated,
  medianRating,
  mostCommonGenre,
  mostSuccessfulGenre,
  isActingCredit,
  isReleased,
  ratingPoints,
  rated,
  revenueRanking,
  selectFeatures,
  selectTvCredits,
  timelineEntries,
  totalRevenue,
  averageRevenue,
  withRevenue,
} from "./movieAnalytics";
import { computeCollaboration } from "./collaborationAnalytics";

export interface AnalyticsInput {
  actorId: number;
  titles: readonly Title[];
  credits: readonly TitleCredits[];
  /** Injected so tests are deterministic. */
  now?: Date;
}

/**
 * Career span from the first to the most recent released acting credit.
 * "Active" = worked in the last two years, or has something announced.
 */
export function computeCareer(titles: readonly Title[], now: Date): ActorAnalytics["career"] {
  const currentYear = now.getUTCFullYear();
  const acting = titles.filter(isActingCredit);
  const releasedYears = acting.filter((t) => isReleased(t, now) && t.year !== null).map((t) => t.year as number);
  const hasUpcoming = acting.some((t) => t.releaseDate !== null && !isReleased(t, now));

  if (releasedYears.length === 0) {
    return { startYear: null, endYear: null, lengthYears: 0, isActive: false, perYear: [], perDecade: [], mostProlificYear: null };
  }

  const startYear = Math.min(...releasedYears);
  const endYear = Math.max(...releasedYears);
  const isActive = endYear >= currentYear - 2 || hasUpcoming;

  const perYear = filmsPerYear(selectFeatures(titles, now));
  const mostProlificYear =
    [...perYear].sort((a, b) => b.films - a.films || b.year - a.year)[0] ?? null;

  return {
    startYear,
    endYear,
    lengthYears: Math.max(1, (isActive ? currentYear : endYear) - startYear),
    isActive,
    perYear,
    perDecade: decadeStats(selectFeatures(titles, now)),
    mostProlificYear,
  };
}

export function computeActorAnalytics(input: AnalyticsInput): ActorAnalytics {
  const now = input.now ?? new Date();
  const features = selectFeatures(input.titles, now);
  const tv = selectTvCredits(input.titles, now);

  const titleByKey = new Map(input.titles.map((t) => [t.key, t]));
  const collabInputs = input.credits.flatMap((credits) => {
    const title = titleByKey.get(credits.titleKey);
    return title ? [{ title, credits }] : [];
  });

  const decades = decadeStats(features);
  const genres = genreStats(features);
  const collaboration = computeCollaboration(collabInputs, input.actorId);
  const career = computeCareer(input.titles, now);

  const partial = {
    counts: {
      features: features.length,
      tvCredits: tv.length,
      ratedFeatures: rated(features).length,
      featuresWithRevenue: withRevenue(features).length,
      detailedFeatures: features.filter((t) => t.hasDetails).length,
    },
    ratings: {
      average: averageRating(features),
      median: medianRating(features),
      highest: highestRated(features),
      lowest: lowestRated(features),
      points: ratingPoints(features),
      byDecade: decades,
      bestDecade: bestDecadeByRating(decades),
    },
    revenue: {
      total: totalRevenue(features),
      average: averageRevenue(features),
      highest: highestGrossing(features),
      ranking: revenueRanking(features, 12),
      bestDecade: bestDecadeByRevenue(decades),
    },
    genres: {
      distribution: genreDistribution(genres),
      stats: genres,
      mostCommon: mostCommonGenre(genres),
      highestRated: highestRatedGenre(genres),
      mostSuccessful: mostSuccessfulGenre(genres),
    },
    career,
    collaboration,
    timeline: timelineEntries(features, 10),
  };

  return { ...partial, highlights: buildHighlights(partial) };
}

/**
 * Turn raw statistics into short, displayable "career highlights".
 * The wording lives here (not in a React component) so it can be tested and reused — e.g. by an
 * AI-summary feature later.
 */
export function buildHighlights(a: Omit<ActorAnalytics, "highlights">): CareerHighlight[] {
  const out: CareerHighlight[] = [];

  if (a.ratings.highest) {
    out.push({
      id: "career-high",
      label: "Career high",
      headline: a.ratings.highest.title,
      detail: `${a.ratings.highest.value.toFixed(1)} rating`,
      posterPath: a.ratings.highest.posterPath,
    });
  }
  if (a.revenue.highest) {
    out.push({
      id: "highest-grossing",
      label: "Highest grossing",
      headline: a.revenue.highest.title,
      detail: formatCompactCurrency(a.revenue.highest.value),
      posterPath: a.revenue.highest.posterPath,
    });
  }
  if (a.genres.mostCommon) {
    out.push({
      id: "most-frequent-genre",
      label: "Most frequent genre",
      headline: a.genres.mostCommon.name,
      detail: `${a.genres.mostCommon.films} films`,
      posterPath: null,
    });
  }
  if (a.ratings.bestDecade && a.ratings.bestDecade.averageRating !== null) {
    out.push({
      id: "best-decade",
      label: "Best decade",
      headline: a.ratings.bestDecade.label,
      detail: `Average rating ${a.ratings.bestDecade.averageRating.toFixed(1)} across ${a.ratings.bestDecade.ratedFilms} films`,
      posterPath: null,
    });
  }
  if (a.collaboration.longest) {
    out.push({
      id: "longest-collaboration",
      label: "Longest collaboration",
      headline: a.collaboration.longest.name,
      detail: `${a.collaboration.longest.films} films together`,
      posterPath: null,
    });
  }
  if (a.career.mostProlificYear && a.career.mostProlificYear.films >= 2) {
    out.push({
      id: "busiest-year",
      label: "Busiest year",
      headline: String(a.career.mostProlificYear.year),
      detail: `${a.career.mostProlificYear.films} films released`,
      posterPath: null,
    });
  }
  return out;
}

