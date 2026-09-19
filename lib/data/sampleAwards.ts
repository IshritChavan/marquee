/**
 * SAMPLE awards dataset — hand-curated demo data, NOT a live source.
 *
 * TMDB has no awards data, so until a real awards API/dataset is plugged in (see lib/api/awards.ts),
 * a few well-known actors are covered here so the Awards section can be built and demoed.
 *
 * Coverage rules (be honest about what's complete):
 *   - Academy Awards: ACTING categories only, complete for these actors.
 *   - Other ceremonies: notable WINS only — nominations are not listed, so the UI never shows
 *     nomination counts for them (see `completeBodies`).
 *   - `year` is the ceremony year (e.g. The Fighter → 2011 ceremony).
 *
 * Keyed by normalized name (lowercase, letters/numbers only) so it survives punctuation
 * differences like "Robert Downey Jr." vs "Robert Downey Jr".
 */
import type { Award, AwardBody } from "@/types/award";

interface SampleEntry {
  awards: Award[];
  /** Bodies for which `awards` lists everything (wins AND nominations). */
  completeBodies: AwardBody[];
}

const win = (body: AwardBody, year: number, category: string, work: string): Award => ({
  body, outcome: "win", year, category, work,
});
const nom = (body: AwardBody, year: number, category: string, work: string): Award => ({
  body, outcome: "nomination", year, category, work,
});

export const SAMPLE_AWARDS: Record<string, SampleEntry> = {
  christianbale: {
    completeBodies: ["academy"],
    awards: [
      win("academy", 2011, "Best Supporting Actor", "The Fighter"),
      nom("academy", 2014, "Best Actor", "American Hustle"),
      nom("academy", 2016, "Best Supporting Actor", "The Big Short"),
      nom("academy", 2019, "Best Actor", "Vice"),
      win("golden-globes", 2011, "Best Supporting Actor – Motion Picture", "The Fighter"),
      win("golden-globes", 2019, "Best Actor – Musical or Comedy", "Vice"),
      win("bafta", 2011, "Best Supporting Actor", "The Fighter"),
      win("sag", 2011, "Male Actor in a Supporting Role", "The Fighter"),
    ],
  },
  leonardodicaprio: {
    completeBodies: ["academy"],
    awards: [
      nom("academy", 1994, "Best Supporting Actor", "What's Eating Gilbert Grape"),
      nom("academy", 2005, "Best Actor", "The Aviator"),
      nom("academy", 2007, "Best Actor", "Blood Diamond"),
      nom("academy", 2014, "Best Actor", "The Wolf of Wall Street"),
      win("academy", 2016, "Best Actor", "The Revenant"),
      nom("academy", 2020, "Best Actor", "Once Upon a Time in Hollywood"),
      win("golden-globes", 2005, "Best Actor – Drama", "The Aviator"),
      win("golden-globes", 2014, "Best Actor – Musical or Comedy", "The Wolf of Wall Street"),
      win("golden-globes", 2016, "Best Actor – Drama", "The Revenant"),
      win("golden-globes", 2020, "Best Actor – Musical or Comedy", "Once Upon a Time in Hollywood"),
      win("bafta", 2016, "Best Actor", "The Revenant"),
      win("sag", 2016, "Male Actor in a Leading Role", "The Revenant"),
    ],
  },
  margotrobbie: {
    completeBodies: ["academy"],
    awards: [
      nom("academy", 2018, "Best Actress", "I, Tonya"),
      nom("academy", 2020, "Best Supporting Actress", "Bombshell"),
    ],
  },
  cillianmurphy: {
    completeBodies: ["academy"],
    awards: [
      win("academy", 2024, "Best Actor", "Oppenheimer"),
      win("golden-globes", 2024, "Best Actor – Drama", "Oppenheimer"),
      win("bafta", 2024, "Best Actor", "Oppenheimer"),
      win("sag", 2024, "Male Actor in a Leading Role", "Oppenheimer"),
    ],
  },
  florencepugh: {
    completeBodies: ["academy"],
    awards: [nom("academy", 2020, "Best Supporting Actress", "Little Women")],
  },
  robertdowneyjr: {
    completeBodies: ["academy"],
    awards: [
      nom("academy", 1993, "Best Actor", "Chaplin"),
      nom("academy", 2009, "Best Supporting Actor", "Tropic Thunder"),
      win("academy", 2024, "Best Supporting Actor", "Oppenheimer"),
      win("golden-globes", 2010, "Best Actor – Musical or Comedy", "Sherlock Holmes"),
      win("golden-globes", 2024, "Best Supporting Actor – Motion Picture", "Oppenheimer"),
      win("bafta", 2024, "Best Supporting Actor", "Oppenheimer"),
      win("sag", 2024, "Male Actor in a Supporting Role", "Oppenheimer"),
    ],
  },
};
