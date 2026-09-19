/**
 * Normalization: raw TMDB shapes → our own models.
 *
 * This is the ONLY place that knows both worlds. It also absorbs TMDB's quirks:
 *   - movies use `title`/`release_date`, TV uses `name`/`first_air_date`
 *   - empty strings and 0 are used instead of null ("" bio, revenue: 0)
 *   - the same title can appear twice in combined_credits
 * Everything downstream can then rely on clean, predictable data.
 */
import { CONFIG } from "@/lib/config";
import { genreNames } from "@/lib/api/genres";
import { parseYear } from "@/lib/utils/formatDate";
import type { Actor, ExternalLink } from "@/types/actor";
import type { ActorSearchResult } from "@/types/search";
import type { PersonRef, Title, TitleCredits } from "@/types/movie";
import type {
  TmdbCastCredit,
  TmdbCrewCredit,
  TmdbMovieDetails,
  TmdbPersonDetails,
  TmdbPersonListItem,
} from "@/types/tmdb";

const PROFESSION_LABELS: Record<string, string> = {
  Acting: "Actor",
  Directing: "Director",
  Writing: "Writer",
  Production: "Producer",
  Sound: "Composer",
  Camera: "Cinematographer",
  Editing: "Editor",
  Crew: "Crew",
};

// ---------------------------------------------------------------------------------------------
// Search / trending
// ---------------------------------------------------------------------------------------------

export function normalizeSearchResult(raw: TmdbPersonListItem): ActorSearchResult {
  const knownFor = (raw.known_for ?? [])
    .map((k) => k.title ?? k.name)
    .filter((name): name is string => Boolean(name))
    .slice(0, 3);

  return {
    id: raw.id,
    name: raw.name,
    profilePath: raw.profile_path ?? null,
    profession: PROFESSION_LABELS[raw.known_for_department ?? ""] ?? "Actor",
    knownFor,
  };
}

// ---------------------------------------------------------------------------------------------
// Credits → Title
// ---------------------------------------------------------------------------------------------

export function normalizeCastCredit(raw: TmdbCastCredit): Title | null {
  if (raw.media_type !== "movie" && raw.media_type !== "tv") return null;
  const mediaType = raw.media_type;

  const name = mediaType === "movie" ? (raw.title ?? raw.name) : (raw.name ?? raw.title);
  if (!name) return null;

  const releaseDate = (mediaType === "movie" ? raw.release_date : raw.first_air_date) || null;
  const voteCount = raw.vote_count ?? 0;
  const average = raw.vote_average ?? 0;

  return {
    key: `${mediaType}-${raw.id}`,
    id: raw.id,
    mediaType,
    title: name,
    releaseDate,
    year: parseYear(releaseDate),
    character: raw.character?.trim() || null,
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    // Ratings from very few votes are noise, so they're treated as "not rated".
    rating: voteCount >= CONFIG.minVotesForRating && average > 0 ? Math.round(average * 10) / 10 : null,
    voteCount,
    popularity: raw.popularity ?? 0,
    genres: genreNames(raw.genre_ids, mediaType),
    overview: raw.overview?.trim() ?? "",
    billingOrder: typeof raw.order === "number" ? raw.order : null,
    episodeCount: typeof raw.episode_count === "number" ? raw.episode_count : null,
    revenue: null,
    budget: null,
    runtime: null,
    director: null,
    imdbId: null,
    hasDetails: false,
  };
}

/** combined_credits can list one title several times (multiple credit rows). Keep one per key. */
export function dedupeTitles(titles: readonly Title[]): Title[] {
  const byKey = new Map<string, Title>();
  for (const title of titles) {
    const existing = byKey.get(title.key);
    if (!existing) {
      byKey.set(title.key, title);
    } else if (!existing.character && title.character) {
      byKey.set(title.key, { ...existing, character: title.character });
    }
  }
  return [...byKey.values()];
}

// ---------------------------------------------------------------------------------------------
// Movie details → enriched Title + credits
// ---------------------------------------------------------------------------------------------

export function mergeMovieDetails(
  title: Title,
  details: TmdbMovieDetails,
): { title: Title; credits: TitleCredits } {
  const toRef = (p: { id: number; name: string; profile_path: string | null }): PersonRef => ({
    id: p.id,
    name: p.name,
    profilePath: p.profile_path ?? null,
  });

  const cast = [...(details.credits?.cast ?? [])]
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, 25)
    .map(toRef);

  const seen = new Set<number>();
  const directors = (details.credits?.crew ?? [])
    .filter((c) => c.job === "Director" && !seen.has(c.id) && seen.add(c.id))
    .map(toRef);

  const genres = (details.genres ?? []).map((g) => g.name);

  return {
    title: {
      ...title,
      genres: genres.length > 0 ? genres : title.genres,
      overview: details.overview?.trim() || title.overview,
      // TMDB reports 0 for "unknown", which would wrongly drag averages down.
      revenue: details.revenue && details.revenue > 0 ? details.revenue : null,
      budget: details.budget && details.budget > 0 ? details.budget : null,
      runtime: details.runtime && details.runtime > 0 ? details.runtime : null,
      director: directors.length > 0 ? directors.slice(0, 2).map((d) => d.name).join(", ") : null,
      imdbId: details.imdb_id || null,
      hasDetails: true,
    },
    credits: { titleKey: title.key, cast, directors },
  };
}

// ---------------------------------------------------------------------------------------------
// Person → Actor
// ---------------------------------------------------------------------------------------------

/** Extra roles (Producer, Director, Writer) inferred from how often the person is credited as crew. */
function deriveRoles(person: TmdbPersonDetails, crew: readonly TmdbCrewCredit[]): string[] {
  const roles: string[] = [PROFESSION_LABELS[person.known_for_department ?? ""] ?? "Actor"];

  const count = (jobs: string[]) => crew.filter((c) => c.job && jobs.includes(c.job)).length;
  const extras: [string, number][] = [
    ["Producer", count(["Producer", "Executive Producer", "Co-Producer"])],
    ["Director", count(["Director"])],
    ["Writer", count(["Writer", "Screenplay", "Story"])],
  ];
  for (const [label, n] of extras) {
    if (n >= 3 && !roles.includes(label)) roles.push(label);
  }
  return roles;
}

function buildLinks(person: TmdbPersonDetails): ExternalLink[] {
  const ids = person.external_ids;
  const links: ExternalLink[] = [];
  const imdbId = ids?.imdb_id;
  if (imdbId) links.push({ kind: "imdb", label: "IMDb", href: `https://www.imdb.com/name/${imdbId}/` });
  links.push({ kind: "tmdb", label: "TMDB", href: `https://www.themoviedb.org/person/${person.id}` });
  if (ids?.instagram_id) links.push({ kind: "instagram", label: "Instagram", href: `https://www.instagram.com/${ids.instagram_id}/` });
  if (ids?.twitter_id) links.push({ kind: "x", label: "X", href: `https://x.com/${ids.twitter_id}` });
  if (ids?.facebook_id) links.push({ kind: "facebook", label: "Facebook", href: `https://www.facebook.com/${ids.facebook_id}` });
  if (person.homepage && /^https?:\/\//.test(person.homepage)) {
    links.push({ kind: "website", label: "Website", href: person.homepage });
  }
  return links;
}

export function normalizeActor(person: TmdbPersonDetails, titles: readonly Title[]): Actor {
  // "Known for": lead roles in the films people have voted on most.
  const lead = titles
    .filter((t) => t.mediaType === "movie" && (t.billingOrder === null || t.billingOrder <= 10))
    .sort((a, b) => b.voteCount - a.voteCount);
  const knownFor = (lead.length > 0 ? lead : [...titles].sort((a, b) => b.popularity - a.popularity))
    .slice(0, 4)
    .map((t) => t.title);

  const heroBackdrop = titles
    .filter((t) => t.backdropPath && t.mediaType === "movie" && (t.billingOrder === null || t.billingOrder <= 5))
    .sort((a, b) => b.voteCount - a.voteCount)[0];

  return {
    id: person.id,
    name: person.name,
    biography: person.biography?.trim() || null,
    birthday: person.birthday || null,
    deathday: person.deathday || null,
    birthplace: person.place_of_birth?.trim() || null,
    profilePath: person.profile_path ?? null,
    heroBackdropPath: heroBackdrop?.backdropPath ?? null,
    roles: deriveRoles(person, person.combined_credits?.crew ?? []),
    knownFor,
    links: buildLinks(person),
    alsoKnownAs: (person.also_known_as ?? []).slice(0, 4),
  };
}
