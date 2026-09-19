/**
 * TMDB client. Thin wrappers: one function per endpoint, returning RAW TMDB shapes.
 * Turning those into our own models happens in lib/services/normalize.ts.
 *
 * Auth: TMDB_API_KEY may be either
 *   - a v3 "API Key" (32 hex chars)  → sent as ?api_key=…
 *   - a v4 "Read Access Token" (a long JWT starting with "eyJ") → sent as a Bearer header
 * We detect which one you pasted, so either works.
 */
import { CONFIG } from "@/lib/config";
import { fetchJson } from "@/lib/api/http";
import { AppError } from "@/lib/utils/errors";
import type {
  TmdbMovieDetails,
  TmdbPagedResponse,
  TmdbPersonDetails,
  TmdbPersonListItem,
} from "@/types/tmdb";

const REVALIDATE = {
  search: 60 * 60,
  trending: 60 * 60 * 6,
  person: 60 * 60 * 6,
  movie: 60 * 60 * 24,
} as const;

function readKey(): string {
  const key = process.env.TMDB_API_KEY?.trim();
  if (!key) {
    throw new AppError("CONFIG", "TMDB_API_KEY is not set");
  }
  return key;
}

function request<T>(
  path: string,
  params: Record<string, string>,
  revalidate: number,
  label: string,
): Promise<T> {
  const key = readKey();
  const isBearerToken = key.startsWith("eyJ") || key.length > 40;

  const url = new URL(`${CONFIG.tmdb.baseUrl}${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  if (!isBearerToken) url.searchParams.set("api_key", key);

  return fetchJson<T>(url.toString(), {
    revalidate,
    label,
    headers: isBearerToken ? { Authorization: `Bearer ${key}` } : undefined,
  });
}

/** GET /search/person — used by autocomplete. */
export async function searchPeople(query: string): Promise<TmdbPersonListItem[]> {
  const data = await request<TmdbPagedResponse<TmdbPersonListItem>>(
    "/search/person",
    { query, include_adult: "false", language: "en-US", page: "1" },
    REVALIDATE.search,
    "TMDB person search",
  );
  return data.results ?? [];
}

/** GET /trending/person/week — landing page. */
export async function getTrendingPeople(): Promise<TmdbPersonListItem[]> {
  const data = await request<TmdbPagedResponse<TmdbPersonListItem>>(
    "/trending/person/week",
    { language: "en-US" },
    REVALIDATE.trending,
    "TMDB trending people",
  );
  return data.results ?? [];
}

/**
 * GET /person/{id}, with the full filmography and external ids folded into ONE request via
 * `append_to_response`. This is the most important call for the profile page.
 */
export function getPerson(id: number): Promise<TmdbPersonDetails> {
  return request<TmdbPersonDetails>(
    `/person/${id}`,
    { append_to_response: "combined_credits,external_ids", language: "en-US" },
    REVALIDATE.person,
    "TMDB person",
  );
}

/**
 * GET /movie/{id} with cast + crew appended. One request gives us revenue, budget, runtime,
 * genres AND the people (for director + collaborator analytics).
 */
export function getMovieDetails(id: number): Promise<TmdbMovieDetails> {
  return request<TmdbMovieDetails>(
    `/movie/${id}`,
    { append_to_response: "credits", language: "en-US" },
    REVALIDATE.movie,
    "TMDB movie",
  );
}
