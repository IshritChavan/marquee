/** Output of the analytics layer (lib/analytics). Plain serializable data — no functions, no Dates. */

export interface TitleRef {
  key: string;
  title: string;
  year: number | null;
  posterPath: string | null;
  /** The number this ref is "about" (rating, revenue…). */
  value: number;
}

export interface DecadeStat {
  decade: number;
  /** "2010s" */
  label: string;
  films: number;
  ratedFilms: number;
  averageRating: number | null;
  totalRevenue: number;
}

export interface YearCount {
  year: number;
  films: number;
}

export interface GenreStat {
  name: string;
  films: number;
  ratedFilms: number;
  averageRating: number | null;
  totalRevenue: number;
}

export interface GenreSlice {
  name: string;
  films: number;
  /** 0–100. Shares sum to 100 because each film tag counts once. */
  share: number;
  isOther: boolean;
}

/** One dot on the career rating chart. */
export interface RatingPoint {
  key: string;
  title: string;
  year: number;
  /** year + fraction of the year, so films in the same year don't overlap exactly. */
  x: number;
  rating: number;
  votes: number;
  character: string | null;
  posterPath: string | null;
  /** Rolling average of the last few films at this point. */
  trend: number;
}

export interface RevenueEntry {
  key: string;
  title: string;
  year: number | null;
  revenue: number;
  posterPath: string | null;
}

export interface Collaborator {
  id: number;
  name: string;
  profilePath: string | null;
  roles: ("actor" | "director")[];
  films: number;
  titles: { key: string; title: string; year: number | null }[];
  averageRating: number | null;
}

export interface CareerHighlight {
  id: string;
  label: string;
  headline: string;
  detail: string;
  posterPath: string | null;
}

export interface TimelineEntry {
  key: string;
  year: number;
  title: string;
  character: string | null;
  rating: number | null;
  posterPath: string | null;
  highlight: boolean;
  isDebut: boolean;
}

export interface ActorAnalytics {
  counts: {
    /** Released, acting-role movies (documentaries and "Self" cameos excluded). */
    features: number;
    tvCredits: number;
    ratedFeatures: number;
    featuresWithRevenue: number;
    /** Films with full details fetched (the sample revenue/collaborators are based on). */
    detailedFeatures: number;
  };
  ratings: {
    average: number | null;
    median: number | null;
    highest: TitleRef | null;
    lowest: TitleRef | null;
    points: RatingPoint[];
    byDecade: DecadeStat[];
    bestDecade: DecadeStat | null;
  };
  revenue: {
    total: number;
    average: number | null;
    highest: TitleRef | null;
    /** Sorted high → low, capped. */
    ranking: RevenueEntry[];
    bestDecade: DecadeStat | null;
  };
  genres: {
    distribution: GenreSlice[];
    stats: GenreStat[];
    mostCommon: GenreStat | null;
    highestRated: GenreStat | null;
    mostSuccessful: GenreStat | null;
  };
  career: {
    startYear: number | null;
    endYear: number | null;
    lengthYears: number;
    isActive: boolean;
    perYear: YearCount[];
    perDecade: DecadeStat[];
    mostProlificYear: YearCount | null;
  };
  collaboration: {
    frequent: Collaborator[];
    directors: Collaborator[];
    longest: Collaborator | null;
  };
  highlights: CareerHighlight[];
  timeline: TimelineEntry[];
}
