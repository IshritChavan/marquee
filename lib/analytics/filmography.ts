/**
 * Filmography sorting and filtering. Pure functions so the UI stays declarative and the behaviour
 * (especially "missing values go last") is unit-tested.
 */
import type { MediaType, Title } from "@/types/movie";

export type SortKey = "rating" | "newest" | "oldest" | "revenue" | "popularity";
export type TypeFilter = "all" | MediaType;

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "popularity", label: "Most popular" },
  { id: "rating", label: "Highest rated" },
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "revenue", label: "Highest grossing" },
];

export interface FilmographyFilter {
  type: TypeFilter;
  /** null = all genres. */
  genre: string | null;
}

export function filterTitles(titles: readonly Title[], filter: FilmographyFilter): Title[] {
  return titles.filter(
    (t) => (filter.type === "all" || t.mediaType === filter.type) && (filter.genre === null || t.genres.includes(filter.genre)),
  );
}

/** Compare two nullable numbers descending; missing values always sort last. */
function descNullsLast(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

/** Returns a NEW sorted array (never mutates the input). */
export function sortTitles(titles: readonly Title[], sort: SortKey): Title[] {
  const list = [...titles];
  switch (sort) {
    case "rating":
      return list.sort((a, b) => descNullsLast(a.rating, b.rating) || b.voteCount - a.voteCount);
    case "revenue":
      return list.sort((a, b) => descNullsLast(a.revenue, b.revenue) || b.popularity - a.popularity);
    case "popularity":
      return list.sort((a, b) => b.popularity - a.popularity);
    case "newest":
      return list.sort((a, b) => {
        if (a.releaseDate === null || b.releaseDate === null) {
          return a.releaseDate === b.releaseDate ? 0 : a.releaseDate === null ? 1 : -1;
        }
        return b.releaseDate.localeCompare(a.releaseDate);
      });
    case "oldest":
      return list.sort((a, b) => {
        if (a.releaseDate === null || b.releaseDate === null) {
          return a.releaseDate === b.releaseDate ? 0 : a.releaseDate === null ? 1 : -1;
        }
        return a.releaseDate.localeCompare(b.releaseDate);
      });
  }
}

/** The most common genres across the filmography, for the filter chips. */
export function topGenres(titles: readonly Title[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const t of titles) for (const g of t.genres) counts.set(g, (counts.get(g) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name]) => name);
}
