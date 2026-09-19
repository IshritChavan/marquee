import type { Title, TitleCredits } from "@/types/movie";

let counter = 0;

/** Build a Title with sensible defaults; override only what a test cares about. */
export function makeTitle(overrides: Partial<Title> = {}): Title {
  counter += 1;
  const id = overrides.id ?? counter;
  const releaseDate = overrides.releaseDate === undefined ? "2005-06-15" : overrides.releaseDate;
  return {
    key: `${overrides.mediaType ?? "movie"}-${id}`,
    id,
    mediaType: "movie",
    title: `Film ${id}`,
    releaseDate,
    year: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
    character: "Someone",
    posterPath: null,
    backdropPath: null,
    rating: 7,
    voteCount: 1000,
    popularity: 10,
    genres: ["Drama"],
    overview: "",
    billingOrder: 1,
    episodeCount: null,
    revenue: null,
    budget: null,
    runtime: null,
    director: null,
    imdbId: null,
    hasDetails: false,
    ...overrides,
  };
}

export function makeCredits(title: Title, cast: [number, string][], directors: [number, string][] = []): TitleCredits {
  return {
    titleKey: title.key,
    cast: cast.map(([id, name]) => ({ id, name, profilePath: null })),
    directors: directors.map(([id, name]) => ({ id, name, profilePath: null })),
  };
}

export const NOW = new Date("2026-09-19T12:00:00Z");
