/**
 * Normalized "title" model — a movie OR a TV credit for an actor.
 * This is what the UI and the analytics layer consume.
 */

export type MediaType = "movie" | "tv";

export interface Title {
  /** Unique across media types: TMDB movie and TV ids can collide, so we prefix. */
  key: string;
  id: number;
  mediaType: MediaType;
  title: string;
  /** ISO date (YYYY-MM-DD) or null when TMDB has no date. */
  releaseDate: string | null;
  year: number | null;
  /** The character the actor played, if known. */
  character: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  /** TMDB average (0–10). null when there are too few votes to be meaningful. */
  rating: number | null;
  voteCount: number;
  popularity: number;
  genres: string[];
  overview: string;
  /** Position in the cast list (0 = top billed). null when unknown. */
  billingOrder: number | null;
  /** TV only. */
  episodeCount: number | null;
  /** Nominal USD. null when TMDB reports 0 / unknown. Only present for "detailed" films. */
  revenue: number | null;
  budget: number | null;
  runtime: number | null;
  director: string | null;
  imdbId: string | null;
  /** True if we made the extra per-movie request (revenue, directors, cast). */
  hasDetails: boolean;
}

export interface PersonRef {
  id: number;
  name: string;
  profilePath: string | null;
}

/** Who else worked on a film. Kept server-side: it feeds collaboration analytics. */
export interface TitleCredits {
  titleKey: string;
  cast: PersonRef[];
  directors: PersonRef[];
}

/** Extra, lazily-loaded info for the movie modal. */
export interface ExternalRatings {
  imdbRating: number | null;
  imdbVotes: string | null;
  metascore: number | null;
  /** Rotten Tomatoes critics score, 0–100. */
  rottenTomatoes: number | null;
  /** Free-text summary from OMDb, e.g. "Won 3 Oscars. 152 wins & 159 nominations total". */
  awardsSummary: string | null;
  rated: string | null;
}

export interface MovieExtras {
  tmdbId: number;
  imdbId: string | null;
  tagline: string | null;
  runtime: number | null;
  revenue: number | null;
  budget: number | null;
  director: string | null;
  /** null when OMDb is not configured or has no record. */
  ratings: ExternalRatings | null;
}
