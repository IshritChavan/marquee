/**
 * Awards service abstraction.
 *
 * TMDB has NO awards data, so awards come through an `AwardsProvider`. The UI never talks to a
 * specific source — it just receives a normalized `AwardsResult`. To add a real source later:
 *
 *   1. Write a class implementing `AwardsProvider` (e.g. an Academy Awards dataset, Wikidata SPARQL,
 *      or a paid API) that returns `AwardsResult`.
 *   2. Register it in `PROVIDERS` below.
 *   3. Set AWARDS_PROVIDER=<its id> in your environment.
 *
 * No component changes needed.
 */
import { SAMPLE_AWARDS } from "@/lib/data/sampleAwards";
import type { AwardsResult } from "@/types/award";

export interface AwardsLookup {
  tmdbId: number;
  name: string;
  imdbId: string | null;
}

export interface AwardsProvider {
  id: string;
  getAwards(lookup: AwardsLookup): Promise<AwardsResult>;
}

/** "Robert Downey Jr." → "robertdowneyjr" */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

class SampleAwardsProvider implements AwardsProvider {
  readonly id = "sample";

  async getAwards(lookup: AwardsLookup): Promise<AwardsResult> {
    const entry = SAMPLE_AWARDS[normalizeName(lookup.name)];
    if (!entry) {
      return {
        status: "unavailable",
        source: "Sample dataset",
        note: "Awards data isn't connected for this actor yet.",
        awards: [],
        completeBodies: [],
      };
    }
    return {
      status: "sample",
      source: "Sample dataset",
      note:
        "Sample data, not a live source. Academy Awards cover acting categories; other ceremonies list notable wins only.",
      awards: entry.awards,
      completeBodies: entry.completeBodies,
    };
  }
}

const PROVIDERS: Record<string, AwardsProvider> = {
  sample: new SampleAwardsProvider(),
};

export function getAwardsProvider(): AwardsProvider {
  const id = process.env.AWARDS_PROVIDER?.trim() || "sample";
  return PROVIDERS[id] ?? PROVIDERS.sample;
}
