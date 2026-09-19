/**
 * searchService — actor autocomplete.
 *
 * Input:  free text typed by the user
 * Output: up to 6 ActorSearchResult (name, photo, profession, known-for titles)
 */
import { searchPeople } from "@/lib/api/tmdb";
import { cached } from "@/lib/cache/cache";
import { CONFIG } from "@/lib/config";
import type { ActorSearchResult } from "@/types/search";
import { normalizeSearchResult } from "./normalize";

export async function searchActors(query: string): Promise<ActorSearchResult[]> {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 80);
  if (q.length < 2) return [];

  return cached(`search:v1:${q.toLowerCase()}`, CONFIG.ttl.search, async () => {
    const raw = await searchPeople(q);
    const results = raw
      // Skip records with no photo AND no known works — they're almost always junk entries.
      .filter((p) => p.profile_path || (p.known_for?.length ?? 0) > 0)
      .map((p) => ({ raw: p, isActor: p.known_for_department === "Acting" }));

    // Actors first (stable sort keeps TMDB's relevance order inside each group).
    results.sort((a, b) => Number(b.isActor) - Number(a.isActor));
    return results.slice(0, 6).map((r) => normalizeSearchResult(r.raw));
  });
}
