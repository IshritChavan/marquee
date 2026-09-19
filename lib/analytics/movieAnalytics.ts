/**
 * Movie-level analytics: everything computed from a list of `Title`s.
 *
 * Input:  Title[] (normalized movies/TV)
 * Output: plain data structures (see types/analytics.ts)
 * Rule:   pure functions. No fetching, no React, no Date.now() (callers pass `now`).
 */
import { CONFIG } from "@/lib/config";
import { isFuture } from "@/lib/utils/formatDate";
import type {
  DecadeStat,
  GenreSlice,
  GenreStat,
  RatingPoint,
  RevenueEntry,
  TimelineEntry,
  TitleRef,
  YearCount,
} from "@/types/analytics";
import type { Title } from "@/types/movie";
import {
  decadeOf,
  groupBy,
  mean,
  median,
  movingAverage,
  percentile,
  roundSharesToHundred,
  sum,
} from "./stats";

// ---------------------------------------------------------------------------------------------
// Which credits count?
// ---------------------------------------------------------------------------------------------

/** Genres that indicate an appearance as themselves rather than a scripted role. */
const NON_SCRIPTED_GENRES = new Set(["Documentary", "Talk", "News", "Reality"]);
const SELF_ROLE = /(^|[^a-z])(self|himself|herself|themselves|archive footage|uncredited)([^a-z]|$)/i;

/** A real acting role — not a talk-show appearance, documentary cameo, or archive footage. */
export function isActingCredit(title: Title): boolean {
  if (title.genres.some((g) => NON_SCRIPTED_GENRES.has(g))) return false;
  if (title.character && SELF_ROLE.test(title.character)) return false;
  return true;
}

export function isReleased(title: Title, now: Date): boolean {
  return title.releaseDate !== null && !isFuture(title.releaseDate, now);
}

/** Released movies with an acting role. The basis for almost every statistic. */
export function selectFeatures(titles: readonly Title[], now: Date): Title[] {
  return titles.filter((t) => t.mediaType === "movie" && isReleased(t, now) && isActingCredit(t));
}

export function selectTvCredits(titles: readonly Title[], now: Date): Title[] {
  return titles.filter((t) => t.mediaType === "tv" && isReleased(t, now) && isActingCredit(t));
}

type Rated = Title & { rating: number };
type WithRevenue = Title & { revenue: number };

export const rated = (titles: readonly Title[]): Rated[] =>
  titles.filter((t): t is Rated => t.rating !== null);

export const withRevenue = (titles: readonly Title[]): WithRevenue[] =>
  titles.filter((t): t is WithRevenue => t.revenue !== null && t.revenue > 0);

function toRef(title: Title, value: number): TitleRef {
  return { key: title.key, title: title.title, year: title.year, posterPath: title.posterPath, value };
}

// ---------------------------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------------------------

export function averageRating(titles: readonly Title[]): number | null {
  return mean(rated(titles).map((t) => t.rating));
}

export function medianRating(titles: readonly Title[]): number | null {
  return median(rated(titles).map((t) => t.rating));
}

/** Highest-rated title. Ties are broken by vote count (more votes = more trustworthy). */
export function highestRated(titles: readonly Title[]): TitleRef | null {
  const best = [...rated(titles)].sort((a, b) => b.rating - a.rating || b.voteCount - a.voteCount)[0];
  return best ? toRef(best, best.rating) : null;
}

export function lowestRated(titles: readonly Title[]): TitleRef | null {
  const worst = [...rated(titles)].sort((a, b) => a.rating - b.rating || b.voteCount - a.voteCount)[0];
  return worst ? toRef(worst, worst.rating) : null;
}

// ---------------------------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------------------------

export function totalRevenue(titles: readonly Title[]): number {
  return sum(withRevenue(titles).map((t) => t.revenue));
}

export function averageRevenue(titles: readonly Title[]): number | null {
  return mean(withRevenue(titles).map((t) => t.revenue));
}

export function highestGrossing(titles: readonly Title[]): TitleRef | null {
  const best = [...withRevenue(titles)].sort((a, b) => b.revenue - a.revenue)[0];
  return best ? toRef(best, best.revenue) : null;
}

export function revenueRanking(titles: readonly Title[], limit: number): RevenueEntry[] {
  return [...withRevenue(titles)]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((t) => ({ key: t.key, title: t.title, year: t.year, revenue: t.revenue, posterPath: t.posterPath }));
}

// ---------------------------------------------------------------------------------------------
// Decades & years
// ---------------------------------------------------------------------------------------------

/** Per-decade counts, average rating and revenue. Sorted oldest → newest. */
export function decadeStats(titles: readonly Title[]): DecadeStat[] {
  const dated = titles.filter((t): t is Title & { year: number } => t.year !== null);
  const groups = groupBy(dated, (t) => decadeOf(t.year));

  return [...groups.entries()]
    .map(([decade, items]) => ({
      decade,
      label: `${decade}s`,
      films: items.length,
      ratedFilms: rated(items).length,
      averageRating: averageRating(items),
      totalRevenue: totalRevenue(items),
    }))
    .sort((a, b) => a.decade - b.decade);
}

/** Decade with the best average rating (needs enough rated films to be meaningful). */
export function bestDecadeByRating(
  decades: readonly DecadeStat[],
  minRatedFilms: number = CONFIG.minFilmsForRanking,
): DecadeStat | null {
  const eligible = decades.filter((d) => d.averageRating !== null && d.ratedFilms >= minRatedFilms);
  return eligible.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))[0] ?? null;
}

/** Decade with the highest total box office. */
export function bestDecadeByRevenue(decades: readonly DecadeStat[]): DecadeStat | null {
  const eligible = decades.filter((d) => d.totalRevenue > 0);
  return eligible.sort((a, b) => b.totalRevenue - a.totalRevenue)[0] ?? null;
}

export function filmsPerYear(titles: readonly Title[]): YearCount[] {
  const dated = titles.filter((t): t is Title & { year: number } => t.year !== null);
  return [...groupBy(dated, (t) => t.year).entries()]
    .map(([year, items]) => ({ year, films: items.length }))
    .sort((a, b) => a.year - b.year);
}

// ---------------------------------------------------------------------------------------------
// Genres
// ---------------------------------------------------------------------------------------------

/** One row per genre. A film with 3 genres contributes to all 3. */
export function genreStats(titles: readonly Title[]): GenreStat[] {
  const groups = new Map<string, Title[]>();
  for (const title of titles) {
    for (const genre of title.genres) {
      const bucket = groups.get(genre);
      if (bucket) bucket.push(title);
      else groups.set(genre, [title]);
    }
  }
  return [...groups.entries()]
    .map(([name, items]) => ({
      name,
      films: items.length,
      ratedFilms: rated(items).length,
      averageRating: averageRating(items),
      totalRevenue: totalRevenue(items),
    }))
    .sort((a, b) => b.films - a.films || a.name.localeCompare(b.name));
}

/**
 * Donut-chart slices: the top genres + one "Other" slice.
 * Shares are of total genre TAGS (not of films), so they sum to exactly 100%.
 */
export function genreDistribution(stats: readonly GenreStat[], maxSlices = 6): GenreSlice[] {
  if (stats.length === 0) return [];
  const sorted = [...stats].sort((a, b) => b.films - a.films);
  const head = sorted.slice(0, maxSlices);
  const tail = sorted.slice(maxSlices);

  const slices = head.map((g) => ({ name: g.name, films: g.films, isOther: false }));
  if (tail.length > 0) {
    slices.push({ name: "Other", films: sum(tail.map((g) => g.films)), isOther: true });
  }

  const shares = roundSharesToHundred(slices.map((s) => s.films));
  return slices.map((s, i) => ({ ...s, share: shares[i] }));
}

export function mostCommonGenre(stats: readonly GenreStat[]): GenreStat | null {
  return [...stats].sort((a, b) => b.films - a.films || (b.averageRating ?? 0) - (a.averageRating ?? 0))[0] ?? null;
}

export function highestRatedGenre(
  stats: readonly GenreStat[],
  minRatedFilms: number = CONFIG.minFilmsForRanking,
): GenreStat | null {
  const eligible = stats.filter((g) => g.averageRating !== null && g.ratedFilms >= minRatedFilms);
  return eligible.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))[0] ?? null;
}

export function mostSuccessfulGenre(stats: readonly GenreStat[]): GenreStat | null {
  return [...stats].filter((g) => g.totalRevenue > 0).sort((a, b) => b.totalRevenue - a.totalRevenue)[0] ?? null;
}

// ---------------------------------------------------------------------------------------------
// Career rating trend (chart data)
// ---------------------------------------------------------------------------------------------

/**
 * One point per rated film, in release order, with a rolling-average `trend` value.
 * `x` is year + month fraction so films from the same year spread out instead of stacking.
 */
export function ratingPoints(titles: readonly Title[], window: number = CONFIG.trendWindow): RatingPoint[] {
  const ordered = rated(titles)
    .filter((t): t is Rated & { year: number; releaseDate: string } => t.year !== null && t.releaseDate !== null)
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

  const trend = movingAverage(ordered.map((t) => t.rating), window);

  let previousX = -Infinity;
  return ordered.map((t, i) => {
    // x must be strictly increasing, or the trend line would draw vertical jumps between films
    // released on the same day. Ties are nudged apart by a tiny amount (invisible on the chart).
    const x = Math.max(t.year + yearFraction(t.releaseDate), previousX + 1e-4);
    previousX = x;
    return {
      key: t.key,
      title: t.title,
      year: t.year,
      x,
      rating: t.rating,
      votes: t.voteCount,
      character: t.character,
      posterPath: t.posterPath,
      trend: trend[i],
    };
  });
}

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

/** How far through the year an ISO date is, 0 ≤ f < 1 (leap days ignored; this is for plotting only). */
function yearFraction(iso: string): number {
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (!(month >= 1 && month <= 12)) return 0;
  const dayOfYear = DAYS_BEFORE_MONTH[month - 1] + (day >= 1 ? day - 1 : 0);
  return Math.min(dayOfYear / 366, 0.999);
}

// ---------------------------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------------------------

/**
 * Pick the films worth showing on a career timeline: the debut plus the most "significant" ones.
 * Significance = rating weighted by how many people voted (a 9.0 with 12 votes shouldn't beat a
 * 8.4 with 2 million). "Highlight" means the film sits in the top quartile of the actor's ratings.
 */
export function timelineEntries(titles: readonly Title[], limit = 10): TimelineEntry[] {
  const dated = titles.filter(
    (t): t is Title & { year: number; releaseDate: string } => t.year !== null && t.releaseDate !== null,
  );
  if (dated.length === 0) return [];

  const chronological = [...dated].sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));
  const debut = chronological[0];

  const score = (t: Title) => (t.rating ?? 0) * Math.log10(t.voteCount + 10);
  const chosen = new Map<string, Title & { year: number; releaseDate: string }>();
  chosen.set(debut.key, debut);
  for (const t of [...dated].filter((x) => x.rating !== null).sort((a, b) => score(b) - score(a))) {
    if (chosen.size >= limit) break;
    chosen.set(t.key, t);
  }

  const cutoff = percentile(rated(dated).map((t) => t.rating), 0.75);

  return [...chosen.values()]
    .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate))
    .map((t) => ({
      key: t.key,
      year: t.year,
      title: t.title,
      character: t.character,
      rating: t.rating,
      posterPath: t.posterPath,
      highlight: t.rating !== null && cutoff !== null && t.rating >= cutoff,
      isDebut: t.key === debut.key,
    }));
}
