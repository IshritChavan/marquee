/**
 * movieService — lazy extras for the movie modal.
 *
 * Input:  a TMDB movie id (when the user opens a film)
 * Output: MovieExtras — runtime/budget/revenue/director from TMDB, plus IMDb / Rotten Tomatoes /
 *         Metascore from OMDb when a key is configured.
 *
 * OMDb failures are swallowed on purpose: the modal must still work without them.
 */
import { getExternalRatings } from "@/lib/api/omdb";
import { getMovieDetails } from "@/lib/api/tmdb";
import { cached } from "@/lib/cache/cache";
import { CONFIG } from "@/lib/config";
import type { ExternalRatings, MovieExtras } from "@/types/movie";

export function getMovieExtras(id: number): Promise<MovieExtras> {
  return cached(`movie:v1:${id}`, CONFIG.ttl.movie, async () => {
    const details = await getMovieDetails(id);
    const imdbId = details.imdb_id || null;

    let ratings: ExternalRatings | null = null;
    if (imdbId) {
      try {
        ratings = await getExternalRatings(imdbId);
      } catch {
        ratings = null;
      }
    }

    const directors = (details.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name);

    return {
      tmdbId: id,
      imdbId,
      tagline: details.tagline?.trim() || null,
      runtime: details.runtime && details.runtime > 0 ? details.runtime : null,
      revenue: details.revenue && details.revenue > 0 ? details.revenue : null,
      budget: details.budget && details.budget > 0 ? details.budget : null,
      director: directors.length > 0 ? [...new Set(directors)].slice(0, 2).join(", ") : null,
      ratings,
    };
  });
}
