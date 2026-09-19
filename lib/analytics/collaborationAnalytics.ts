/**
 * Who does this actor work with again and again?
 *
 * Input:  for each detailed film — the Title plus its cast/directors (from TMDB /movie/{id}?credits)
 * Output: repeat collaborators (co-stars and directors) ranked by number of shared films
 *
 * Only top-billed cast count, so a crowd scene extra doesn't become a "collaborator".
 */
import { CONFIG } from "@/lib/config";
import type { Collaborator } from "@/types/analytics";
import type { PersonRef, Title, TitleCredits } from "@/types/movie";
import { mean } from "./stats";

export interface CollaborationInput {
  title: Title;
  credits: TitleCredits;
}

interface Accumulator {
  ref: PersonRef;
  roles: Set<"actor" | "director">;
  titles: Map<string, { key: string; title: string; year: number | null }>;
  ratings: number[];
}

export interface CollaborationResult {
  frequent: Collaborator[];
  directors: Collaborator[];
  longest: Collaborator | null;
}

export function computeCollaboration(
  inputs: readonly CollaborationInput[],
  actorId: number,
  options: { minSharedFilms?: number; billingCutoff?: number; limit?: number } = {},
): CollaborationResult {
  const minShared = options.minSharedFilms ?? CONFIG.minSharedFilms;
  const cutoff = options.billingCutoff ?? CONFIG.collaboratorBillingCutoff;
  const limit = options.limit ?? 12;

  const people = new Map<number, Accumulator>();

  function record(person: PersonRef, role: "actor" | "director", title: Title) {
    if (person.id === actorId) return; // never list the actor as their own collaborator
    let acc = people.get(person.id);
    if (!acc) {
      acc = { ref: person, roles: new Set(), titles: new Map(), ratings: [] };
      people.set(person.id, acc);
    }
    acc.roles.add(role);
    if (!acc.titles.has(title.key)) {
      acc.titles.set(title.key, { key: title.key, title: title.title, year: title.year });
      if (title.rating !== null) acc.ratings.push(title.rating);
    }
    // Prefer a version of the person that has a photo.
    if (!acc.ref.profilePath && person.profilePath) acc.ref = person;
  }

  for (const { title, credits } of inputs) {
    for (const member of credits.cast.slice(0, cutoff)) record(member, "actor", title);
    for (const director of credits.directors) record(director, "director", title);
  }

  const all: Collaborator[] = [...people.values()]
    .filter((acc) => acc.titles.size >= minShared)
    .map((acc) => ({
      id: acc.ref.id,
      name: acc.ref.name,
      profilePath: acc.ref.profilePath,
      roles: [...acc.roles].sort() as Collaborator["roles"],
      films: acc.titles.size,
      titles: [...acc.titles.values()].sort((a, b) => (a.year ?? 0) - (b.year ?? 0)),
      averageRating: mean(acc.ratings),
    }))
    .sort(
      (a, b) =>
        b.films - a.films ||
        // On a tie, directors rank first: a repeat director says more about a career than a co-star.
        Number(b.roles.includes("director")) - Number(a.roles.includes("director")) ||
        (b.averageRating ?? 0) - (a.averageRating ?? 0) ||
        a.name.localeCompare(b.name),
    );

  return {
    frequent: all.slice(0, limit),
    directors: all.filter((c) => c.roles.includes("director")).slice(0, 6),
    longest: all[0] ?? null,
  };
}

/** Most frequent directors, on their own (used by the highlights and future director analytics). */
export function mostFrequentDirectors(inputs: readonly CollaborationInput[], actorId: number): Collaborator[] {
  return computeCollaboration(inputs, actorId, { limit: 50 }).directors;
}
