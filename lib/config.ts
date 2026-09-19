/**
 * Central tunables. Every "magic number" that shapes API usage or analytics lives here,
 * so behaviour can be adjusted in one place.
 */

export const CONFIG = {
  tmdb: {
    // TMDB_BASE_URL is overridable so `npm run mock` can stand in for the real API.
    baseUrl: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
    imageBase: "https://image.tmdb.org/t/p",
  },
  omdb: { baseUrl: "https://www.omdbapi.com/" },

  /**
   * At most this many films get the extra "details" request (revenue, directors, cast).
   * An actor can have 100+ credits; this keeps a cold profile load to ~40 parallel calls.
   */
  maxDetailedFilms: 40,
  /** Parallel TMDB requests at once. TMDB allows ~50/s; we stay well below. */
  tmdbConcurrency: 8,

  /** A TMDB rating with fewer votes than this is treated as "not rated" (too noisy). */
  minVotesForRating: 50,
  /** Genre / decade "best" rankings need at least this many rated films to count. */
  minFilmsForRanking: 3,
  /** Rolling-average window (in films) for the career rating trend line. */
  trendWindow: 5,
  /** A collaborator must share at least this many films to be listed. */
  minSharedFilms: 2,
  /** Only cast members billed in the top N of a film count as collaborators. */
  collaboratorBillingCutoff: 15,

  /** Cache lifetimes, in seconds. */
  ttl: {
    search: 60 * 60,
    trending: 60 * 60 * 6,
    actor: 60 * 60 * 6,
    movie: 60 * 60 * 24,
  },
} as const;

/** Popular names shown on the landing page. They are resolved to real TMDB ids server-side. */
export const POPULAR_SEARCHES = [
  "Leonardo DiCaprio",
  "Margot Robbie",
  "Christian Bale",
  "Cillian Murphy",
  "Florence Pugh",
  "Robert Downey Jr.",
] as const;
