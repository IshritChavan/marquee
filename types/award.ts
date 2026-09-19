export type AwardBody = "academy" | "golden-globes" | "bafta" | "emmys" | "sag";

export type AwardOutcome = "win" | "nomination";

export interface Award {
  body: AwardBody;
  outcome: AwardOutcome;
  /** Ceremony year. */
  year: number;
  category: string;
  /** Film or show the award was for. */
  work: string | null;
}

/**
 * - "available":   data from a live/complete source
 * - "sample":      built-in demo dataset (partial, hand-curated)
 * - "unavailable": nothing known for this person
 */
export type AwardsStatus = "available" | "sample" | "unavailable";

export interface AwardsResult {
  status: AwardsStatus;
  /** Human-readable source name, shown in the UI. */
  source: string;
  note: string | null;
  awards: Award[];
  /**
   * Bodies for which `awards` is a COMPLETE list (wins and nominations). For other bodies the list
   * may contain only notable wins, so the UI must not show nomination counts for them.
   */
  completeBodies: AwardBody[];
}

/** Nominations INCLUDE wins (Academy convention: "4 nominations, 1 win"). */
export interface AwardTally {
  wins: number;
  nominations: number;
}

export const AWARD_BODIES: { id: AwardBody; label: string }[] = [
  { id: "academy", label: "Academy Awards" },
  { id: "golden-globes", label: "Golden Globes" },
  { id: "bafta", label: "BAFTA" },
  { id: "emmys", label: "Emmys" },
  { id: "sag", label: "SAG Awards" },
];
