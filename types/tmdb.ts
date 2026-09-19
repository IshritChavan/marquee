/**
 * RAW TMDB response shapes (only the fields we use).
 *
 * Rule: this file is imported ONLY by lib/api/* and lib/services/normalize.ts.
 * Components never see these types — they consume the normalized models in
 * types/actor.ts, types/movie.ts, etc. That way, if TMDB changes (or we swap
 * data providers), only the normalization layer needs to change.
 */

export interface TmdbKnownFor {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
}

/** Item from /search/person and /trending/person/{window}. */
export interface TmdbPersonListItem {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  known_for?: TmdbKnownFor[];
}

export interface TmdbCastCredit {
  id: number;
  media_type: "movie" | "tv" | string;
  title?: string;
  name?: string;
  character?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  poster_path?: string | null;
  backdrop_path?: string | null;
  overview?: string;
  order?: number;
  episode_count?: number;
}

export interface TmdbCrewCredit {
  id: number;
  media_type: "movie" | "tv" | string;
  job?: string;
  department?: string;
}

export interface TmdbExternalIds {
  imdb_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  facebook_id?: string | null;
}

export interface TmdbPersonDetails {
  id: number;
  name: string;
  biography?: string;
  birthday?: string | null;
  deathday?: string | null;
  place_of_birth?: string | null;
  profile_path?: string | null;
  known_for_department?: string;
  homepage?: string | null;
  also_known_as?: string[];
  combined_credits?: { cast?: TmdbCastCredit[]; crew?: TmdbCrewCredit[] };
  external_ids?: TmdbExternalIds;
}

export interface TmdbMovieCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  order?: number;
  character?: string;
}

export interface TmdbMovieCrewMember {
  id: number;
  name: string;
  profile_path: string | null;
  job?: string;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  tagline?: string;
  overview?: string;
  release_date?: string;
  runtime?: number | null;
  revenue?: number;
  budget?: number;
  imdb_id?: string | null;
  genres?: { id: number; name: string }[];
  credits?: { cast?: TmdbMovieCastMember[]; crew?: TmdbMovieCrewMember[] };
}

export interface TmdbPagedResponse<T> {
  page: number;
  results: T[];
  total_results?: number;
}
