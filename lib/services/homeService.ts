/**
 * homeService — data for the landing page.
 *
 *   getTrendingActors():      TMDB's weekly trending people, filtered to actors with a photo
 *   getPopularSearchActors(): the fixed "popular searches" names, resolved to real TMDB ids
 */
import { getTrendingPeople } from "@/lib/api/tmdb";
import { cached } from "@/lib/cache/cache";
import { CONFIG, POPULAR_SEARCHES } from "@/lib/config";
import type { ActorSearchResult } from "@/types/search";
import { normalizeSearchResult } from "./normalize";
import { searchActors } from "./searchService";

export function getTrendingActors(limit = 10): Promise<ActorSearchResult[]> {
  return cached("trending:v1", CONFIG.ttl.trending, async () => {
    const people = await getTrendingPeople();
    return people
      .filter((p) => p.known_for_department === "Acting" && p.profile_path)
      .slice(0, limit)
      .map(normalizeSearchResult);
  });
}

export async function getPopularSearchActors(): Promise<ActorSearchResult[]> {
  // allSettled: a failed lookup just means that chip is skipped — never break the landing page.
  const settled = await Promise.allSettled(POPULAR_SEARCHES.map((name) => searchActors(name)));
  return settled.flatMap((result) =>
    result.status === "fulfilled" && result.value[0] ? [result.value[0]] : [],
  );
}
