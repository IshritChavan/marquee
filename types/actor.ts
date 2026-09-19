import type { ActorAnalytics } from "./analytics";
import type { AwardsResult } from "./award";
import type { Title } from "./movie";

export interface ExternalLink {
  kind: "imdb" | "tmdb" | "instagram" | "x" | "facebook" | "website";
  label: string;
  href: string;
}

export interface Actor {
  id: number;
  name: string;
  /** null when TMDB has no biography. The UI shows a fallback message. */
  biography: string | null;
  birthday: string | null;
  deathday: string | null;
  birthplace: string | null;
  profilePath: string | null;
  /** Wide image used for the hero glow: the backdrop of their best-known film. */
  heroBackdropPath: string | null;
  /** e.g. ["Actor", "Producer"]. */
  roles: string[];
  knownFor: string[];
  links: ExternalLink[];
  alsoKnownAs: string[];
}

export interface ProfileMeta {
  /** All acting credits TMDB lists (movies + TV). */
  totalCredits: number;
  /** How many films we fetched full details for (revenue, directors, cast). */
  detailedFilms: number;
  generatedAt: string;
  /** Non-fatal problems (e.g. "3 movie lookups failed"). Shown quietly in the UI. */
  warnings: string[];
}

export interface ActorProfile {
  actor: Actor;
  titles: Title[];
  analytics: ActorAnalytics;
  awards: AwardsResult;
  meta: ProfileMeta;
}
