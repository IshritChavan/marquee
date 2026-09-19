import type { Award, AwardBody, AwardTally } from "@/types/award";

/** Wins and nominations for one ceremony. Nominations INCLUDE wins ("4 nominations, 1 win"). */
export function tallyAwards(awards: readonly Award[], body?: AwardBody): AwardTally {
  const relevant = body ? awards.filter((a) => a.body === body) : awards;
  return {
    wins: relevant.filter((a) => a.outcome === "win").length,
    nominations: relevant.length,
  };
}
