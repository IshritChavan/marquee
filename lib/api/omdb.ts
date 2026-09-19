/**
 * OMDb client — optional. Adds IMDb rating, Rotten Tomatoes, Metascore and an awards blurb.
 *
 * We only call this when a movie modal is opened (never for the whole filmography), because the
 * free tier allows just 1,000 requests/day. If the key is missing or OMDb has no record, we return
 * null and the UI simply hides that block.
 */
import { CONFIG } from "@/lib/config";
import { fetchJson } from "@/lib/api/http";
import type { ExternalRatings } from "@/types/movie";

interface OmdbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  imdbVotes?: string;
  Metascore?: string;
  Rated?: string;
  Awards?: string;
  Ratings?: { Source: string; Value: string }[];
}

/** OMDb uses the literal string "N/A" for missing values. */
function clean(value: string | undefined): string | null {
  return value && value !== "N/A" ? value : null;
}

function toNumber(value: string | undefined): number | null {
  const cleaned = clean(value);
  if (cleaned === null) return null;
  const n = Number(cleaned.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function isOmdbConfigured(): boolean {
  return Boolean(process.env.OMDB_API_KEY?.trim());
}

export async function getExternalRatings(imdbId: string): Promise<ExternalRatings | null> {
  const key = process.env.OMDB_API_KEY?.trim();
  if (!key) return null;

  const url = new URL(CONFIG.omdb.baseUrl);
  url.searchParams.set("apikey", key);
  url.searchParams.set("i", imdbId);

  const data = await fetchJson<OmdbResponse>(url.toString(), {
    revalidate: 60 * 60 * 24,
    label: "OMDb",
  });
  if (data.Response !== "True") return null;

  const rt = data.Ratings?.find((r) => r.Source === "Rotten Tomatoes")?.Value;

  return {
    imdbRating: toNumber(data.imdbRating),
    imdbVotes: clean(data.imdbVotes),
    metascore: toNumber(data.Metascore),
    rottenTomatoes: rt ? toNumber(rt.replace("%", "")) : null,
    awardsSummary: clean(data.Awards),
    rated: clean(data.Rated),
  };
}
