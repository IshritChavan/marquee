/**
 * actorService — builds a complete `ActorProfile`.
 *
 * Input:  a TMDB person id
 * Output: ActorProfile { actor, titles, analytics, awards, meta }
 *
 * Request budget for a cold load (this is the important design decision):
 *   1 request   GET /person/{id}?append_to_response=combined_credits,external_ids   → ALL credits
 *   ≤40 requests GET /movie/{id}?append_to_response=credits  → revenue, directors, cast
 *               (only for the most significant films, max 8 in flight at once)
 * The remaining credits (often 100+) keep the basic info from step 1 — no extra requests.
 * The whole result is cached, so a repeat visit costs 0 requests.
 */
import { getAwardsProvider } from "@/lib/api/awards";
import { getMovieDetails, getPerson } from "@/lib/api/tmdb";
import { computeActorAnalytics, isActingCredit, isReleased } from "@/lib/analytics";
import { cached } from "@/lib/cache/cache";
import { CONFIG } from "@/lib/config";
import { mapWithConcurrency } from "@/lib/utils/async";
import { isAppError } from "@/lib/utils/errors";
import type { ActorProfile } from "@/types/actor";
import type { AwardsResult } from "@/types/award";
import type { Title, TitleCredits } from "@/types/movie";
import { dedupeTitles, mergeMovieDetails, normalizeActor, normalizeCastCredit } from "./normalize";

export function getActorProfile(id: number): Promise<ActorProfile> {
  // The "v1" in the key lets us invalidate every cached profile if the shape ever changes.
  return cached(`actor:v1:${id}`, CONFIG.ttl.actor, () => buildActorProfile(id));
}

/**
 * Choose which films deserve the expensive detail request:
 * released movies with a real acting role, billed reasonably high, ranked by vote count
 * (a proxy for "how much does the audience care about this film").
 */
export function pickDetailTargets(titles: readonly Title[], now: Date, max: number = CONFIG.maxDetailedFilms): Title[] {
  return titles
    .filter(
      (t) =>
        t.mediaType === "movie" &&
        isReleased(t, now) &&
        isActingCredit(t) &&
        (t.billingOrder === null || t.billingOrder <= 15),
    )
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, max);
}

async function buildActorProfile(id: number): Promise<ActorProfile> {
  const now = new Date();

  // Step 1: person + full filmography in one request.
  const person = await getPerson(id);
  const baseTitles = dedupeTitles(
    (person.combined_credits?.cast ?? []).flatMap((credit) => {
      const title = normalizeCastCredit(credit);
      return title ? [title] : [];
    }),
  );

  const targets = pickDetailTargets(baseTitles, now);

  // Step 2: film details and awards run in parallel — neither depends on the other.
  const unavailableAwards: AwardsResult = {
    status: "unavailable",
    source: "Awards provider",
    note: "Awards data couldn't be loaded right now.",
    awards: [],
    completeBodies: [],
  };
  const [detailResults, awards] = await Promise.all([
    mapWithConcurrency(targets, CONFIG.tmdbConcurrency, (t) => getMovieDetails(t.id)),
    getAwardsProvider()
      .getAwards({ tmdbId: person.id, name: person.name, imdbId: person.external_ids?.imdb_id ?? null })
      .catch(() => unavailableAwards),
  ]);

  // Step 3: merge details into the titles. A failed lookup just leaves that film with basic data.
  const detailed = new Map<string, { title: Title; credits: TitleCredits }>();
  let failures = 0;
  let rateLimited = false;
  detailResults.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const merged = mergeMovieDetails(targets[index], result.value);
      detailed.set(merged.title.key, merged);
    } else {
      failures += 1;
      if (isAppError(result.reason) && result.reason.code === "RATE_LIMITED") rateLimited = true;
    }
  });

  const titles = baseTitles.map((t) => detailed.get(t.key)?.title ?? t);
  const credits = [...detailed.values()].map((d) => d.credits);

  const warnings: string[] = [];
  if (failures > 0) {
    warnings.push(
      rateLimited
        ? "TMDB rate-limited some requests, so revenue and collaborator data is partial. Reload in a minute."
        : `${failures} film lookup${failures === 1 ? "" : "s"} failed, so revenue and collaborator data may be incomplete.`,
    );
  }

  // Step 4: analytics — pure functions over the normalized data.
  const analytics = computeActorAnalytics({ actorId: person.id, titles, credits, now });

  return {
    actor: normalizeActor(person, titles),
    titles,
    analytics,
    awards,
    meta: {
      totalCredits: baseTitles.length,
      detailedFilms: detailed.size,
      generatedAt: now.toISOString(),
      warnings,
    },
  };
}
