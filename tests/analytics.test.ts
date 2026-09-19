import { describe, expect, it } from "vitest";
import {
  averageRating,
  averageRevenue,
  bestDecadeByRating,
  bestDecadeByRevenue,
  computeActorAnalytics,
  computeCareer,
  computeCollaboration,
  decadeStats,
  filmsPerYear,
  filterTitles,
  genreDistribution,
  genreStats,
  highestGrossing,
  highestRated,
  highestRatedGenre,
  isActingCredit,
  lowestRated,
  medianRating,
  mostCommonGenre,
  mostSuccessfulGenre,
  movingAverage,
  ratingPoints,
  roundSharesToHundred,
  selectFeatures,
  sortTitles,
  tallyAwards,
  timelineEntries,
  topGenres,
  totalRevenue,
} from "@/lib/analytics";
import { pickDetailTargets } from "@/lib/services/actorService";
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";
import { ageFrom, formatLongDate, formatRuntime, formatYearRange } from "@/lib/utils/formatDate";
import { makeCredits, makeTitle, NOW } from "./fixtures";

describe("ratings", () => {
  const titles = [
    makeTitle({ title: "A", rating: 9.0 }),
    makeTitle({ title: "B", rating: 7.0 }),
    makeTitle({ title: "C", rating: 5.0 }),
    makeTitle({ title: "Unrated", rating: null }),
  ];

  it("averages only rated titles", () => expect(averageRating(titles)).toBeCloseTo(7.0));
  it("computes the median of rated titles", () => expect(medianRating(titles)).toBe(7));
  it("median of an even count is the mean of the middle two", () => {
    expect(medianRating([makeTitle({ rating: 6 }), makeTitle({ rating: 8 })])).toBe(7);
  });
  it("finds highest and lowest rated", () => {
    expect(highestRated(titles)?.title).toBe("A");
    expect(lowestRated(titles)?.title).toBe("C");
  });
  it("breaks rating ties by vote count", () => {
    const tie = [
      makeTitle({ title: "few votes", rating: 8, voteCount: 100 }),
      makeTitle({ title: "many votes", rating: 8, voteCount: 90000 }),
    ];
    expect(highestRated(tie)?.title).toBe("many votes");
  });
  it("returns null when nothing is rated", () => {
    expect(averageRating([])).toBeNull();
    expect(highestRated([makeTitle({ rating: null })])).toBeNull();
  });
});

describe("revenue", () => {
  const titles = [
    makeTitle({ title: "Big", revenue: 1_000_000_000 }),
    makeTitle({ title: "Small", revenue: 200_000_000 }),
    makeTitle({ title: "Unknown", revenue: null }),
  ];
  it("totals only known revenue", () => expect(totalRevenue(titles)).toBe(1_200_000_000));
  it("averages over films WITH revenue, not all films", () => expect(averageRevenue(titles)).toBe(600_000_000));
  it("finds the highest grossing film", () => expect(highestGrossing(titles)?.title).toBe("Big"));
  it("handles no revenue data", () => {
    expect(totalRevenue([makeTitle()])).toBe(0);
    expect(averageRevenue([makeTitle()])).toBeNull();
    expect(highestGrossing([makeTitle()])).toBeNull();
  });
});

describe("decades and years", () => {
  const titles = [
    makeTitle({ releaseDate: "1999-01-01", rating: 6, revenue: 10 }),
    makeTitle({ releaseDate: "2008-07-18", rating: 9, revenue: 100 }),
    makeTitle({ releaseDate: "2010-07-16", rating: 8, revenue: 500 }),
    makeTitle({ releaseDate: "2012-07-20", rating: 8.4, revenue: 400 }),
    makeTitle({ releaseDate: "2014-11-05", rating: 8, revenue: 300 }),
  ];

  it("groups by decade with counts and averages", () => {
    const decades = decadeStats(titles);
    expect(decades.map((d) => d.label)).toEqual(["1990s", "2000s", "2010s"]);
    expect(decades[2].films).toBe(3);
    expect(decades[2].averageRating).toBeCloseTo((8 + 8.4 + 8) / 3);
    expect(decades[2].totalRevenue).toBe(1200);
  });
  it("picks the best decade by rating, requiring enough films", () => {
    const decades = decadeStats(titles);
    // 2000s averages 9.0 but has only one film → not eligible with a 3-film minimum
    expect(bestDecadeByRating(decades, 3)?.label).toBe("2010s");
    expect(bestDecadeByRating(decades, 1)?.label).toBe("2000s");
  });
  it("picks the best decade by revenue", () => expect(bestDecadeByRevenue(decadeStats(titles))?.label).toBe("2010s"));
  it("counts films per year", () => {
    const perYear = filmsPerYear([...titles, makeTitle({ releaseDate: "2010-01-01" })]);
    expect(perYear.find((y) => y.year === 2010)?.films).toBe(2);
    expect(perYear[0].year).toBe(1999);
  });
});

describe("genres", () => {
  const titles = [
    makeTitle({ genres: ["Drama", "Thriller"], rating: 8, revenue: 100 }),
    makeTitle({ genres: ["Drama"], rating: 7, revenue: 50 }),
    makeTitle({ genres: ["Drama", "Action"], rating: 9, revenue: 900 }),
    makeTitle({ genres: ["Action"], rating: 6, revenue: 400 }),
    makeTitle({ genres: ["Comedy"], rating: 5 }),
  ];
  const stats = genreStats(titles);

  it("counts a multi-genre film under each genre", () => {
    expect(stats.find((g) => g.name === "Drama")?.films).toBe(3);
    expect(stats.find((g) => g.name === "Action")?.films).toBe(2);
  });
  it("finds the most common genre", () => expect(mostCommonGenre(stats)?.name).toBe("Drama"));
  it("finds the most commercially successful genre", () => expect(mostSuccessfulGenre(stats)?.name).toBe("Action"));
  it("only ranks genres with enough rated films for 'highest rated'", () => {
    expect(highestRatedGenre(stats, 3)?.name).toBe("Drama");
    expect(highestRatedGenre(stats, 2)?.name).toBe("Drama"); // Drama 8.0 vs Action 7.5
    expect(highestRatedGenre(stats, 4)).toBeNull();
  });
  it("builds a donut distribution that sums to exactly 100", () => {
    const many = genreStats(
      ["A", "B", "C", "D", "E", "F", "G", "H"].flatMap((g, i) =>
        Array.from({ length: i + 1 }, () => makeTitle({ genres: [g] })),
      ),
    );
    const slices = genreDistribution(many, 6);
    expect(slices).toHaveLength(7);
    expect(slices[slices.length - 1]).toMatchObject({ name: "Other", isOther: true });
    expect(slices.reduce((s, x) => s + x.share, 0)).toBe(100);
  });
  it("largest-remainder rounding always sums to 100", () => {
    expect(roundSharesToHundred([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100);
    expect(roundSharesToHundred([0, 0])).toEqual([0, 0]);
  });
});

describe("credits filtering", () => {
  it("excludes documentaries, talk shows and 'Self' appearances", () => {
    expect(isActingCredit(makeTitle({ genres: ["Documentary"] }))).toBe(false);
    expect(isActingCredit(makeTitle({ genres: ["Talk"], mediaType: "tv" }))).toBe(false);
    expect(isActingCredit(makeTitle({ character: "Himself" }))).toBe(false);
    expect(isActingCredit(makeTitle({ character: "Self (archive footage)" }))).toBe(false);
    expect(isActingCredit(makeTitle({ character: "Bruce Wayne / Batman" }))).toBe(true);
    expect(isActingCredit(makeTitle({ character: null }))).toBe(true);
  });
  it("selectFeatures keeps released movies only", () => {
    const list = [
      makeTitle({ title: "released" }),
      makeTitle({ title: "upcoming", releaseDate: "2027-05-01" }),
      makeTitle({ title: "undated", releaseDate: null }),
      makeTitle({ title: "tv", mediaType: "tv" }),
    ];
    expect(selectFeatures(list, NOW).map((t) => t.title)).toEqual(["released"]);
  });
});

describe("rating chart data", () => {
  it("orders by release date and computes a trailing rolling average", () => {
    const points = ratingPoints(
      [
        makeTitle({ releaseDate: "2002-01-01", rating: 6 }),
        makeTitle({ releaseDate: "2000-01-01", rating: 8 }),
        makeTitle({ releaseDate: "2001-01-01", rating: 4 }),
      ],
      2,
    );
    expect(points.map((p) => p.year)).toEqual([2000, 2001, 2002]);
    expect(points.map((p) => p.trend)).toEqual([8, 6, 5]);
  });
  it("spreads same-year films across the year using the release month", () => {
    const [a, b] = ratingPoints([
      makeTitle({ releaseDate: "2010-01-10" }),
      makeTitle({ releaseDate: "2010-07-16" }),
    ]);
    expect(b.x).toBeGreaterThan(a.x);
    expect(Math.floor(b.x)).toBe(2010);
  });

  it("keeps x strictly increasing even for films released on the same day", () => {
    const same = ["a", "b", "c"].map((id) =>
      makeTitle({ key: id, title: id, releaseDate: "2015-06-12", year: 2015, rating: 7, voteCount: 500 }),
    );
    const xs = ratingPoints(same).map((p) => p.x);
    expect(xs[1]).toBeGreaterThan(xs[0]);
    expect(xs[2]).toBeGreaterThan(xs[1]);
    expect(Math.floor(xs[2])).toBe(2015);
  });
  it("movingAverage starts at the first value", () => expect(movingAverage([2, 4, 6], 5)).toEqual([2, 3, 4]));
});

describe("collaboration", () => {
  const ACTOR = 1;
  const f1 = makeTitle({ title: "Batman Begins", rating: 8 });
  const f2 = makeTitle({ title: "The Dark Knight", rating: 9 });
  const f3 = makeTitle({ title: "Solo Film", rating: 6 });
  const inputs = [
    { title: f1, credits: makeCredits(f1, [[ACTOR, "Actor"], [2, "Michael Caine"]], [[10, "Christopher Nolan"]]) },
    { title: f2, credits: makeCredits(f2, [[ACTOR, "Actor"], [2, "Michael Caine"], [3, "One-off"]], [[10, "Christopher Nolan"]]) },
    { title: f3, credits: makeCredits(f3, [[ACTOR, "Actor"], [3, "One-off"]], [[11, "Other Director"]]) },
  ];

  it("lists people who share at least two films, and never the actor", () => {
    const { frequent } = computeCollaboration(inputs, ACTOR);
    expect(frequent.map((c) => c.name)).toEqual(["Christopher Nolan", "Michael Caine", "One-off"]);
    expect(frequent.find((c) => c.id === ACTOR)).toBeUndefined();
    expect(frequent.find((c) => c.name === "Other Director")).toBeUndefined();
  });
  it("on a tie, ranks directors above co-stars and averages the shared ratings", () => {
    const { frequent, longest, directors } = computeCollaboration(inputs, ACTOR);
    expect(longest?.name).toBe("Christopher Nolan");
    expect(frequent[0].films).toBe(2);
    expect(frequent[0].averageRating).toBeCloseTo(8.5);
    expect(directors.map((d) => d.name)).toEqual(["Christopher Nolan"]);
  });
  it("ignores cast billed below the cutoff", () => {
    const { frequent } = computeCollaboration(inputs, ACTOR, { billingCutoff: 1 });
    expect(frequent.find((c) => c.name === "Michael Caine")).toBeUndefined();
  });
  it("returns empty results with no data", () => {
    expect(computeCollaboration([], ACTOR)).toEqual({ frequent: [], directors: [], longest: null });
  });
});

describe("career and full analytics", () => {
  const titles = [
    makeTitle({ releaseDate: "1987-12-09", rating: 7.6, voteCount: 5000, title: "Debut" }),
    makeTitle({ releaseDate: "2000-04-14", rating: 7.3, title: "Mid" }),
    makeTitle({ releaseDate: "2008-07-18", rating: 9.0, voteCount: 3_000_000, revenue: 1_006_000_000, title: "Peak", hasDetails: true }),
    makeTitle({ releaseDate: "2024-03-01", rating: 7.0, title: "Recent", genres: ["Thriller"] }),
    makeTitle({ releaseDate: "2027-01-01", rating: null, voteCount: 0, title: "Upcoming" }),
    makeTitle({ mediaType: "tv", releaseDate: "2015-01-01", title: "A Show" }),
  ];

  it("computes career span and marks working actors as active", () => {
    const career = computeCareer(titles, NOW);
    expect(career.startYear).toBe(1987);
    expect(career.endYear).toBe(2024);
    expect(career.isActive).toBe(true);
    expect(career.lengthYears).toBe(2026 - 1987);
  });
  it("marks a retired actor as inactive and stops the clock at their last credit", () => {
    const career = computeCareer([makeTitle({ releaseDate: "1960-01-01" }), makeTitle({ releaseDate: "1975-01-01" })], NOW);
    expect(career.isActive).toBe(false);
    expect(career.lengthYears).toBe(15);
  });
  it("assembles everything without upcoming or TV titles polluting movie stats", () => {
    const a = computeActorAnalytics({ actorId: 1, titles, credits: [], now: NOW });
    expect(a.counts.features).toBe(4);
    expect(a.counts.tvCredits).toBe(1);
    expect(a.counts.featuresWithRevenue).toBe(1);
    expect(a.ratings.highest?.title).toBe("Peak");
    expect(a.revenue.total).toBe(1_006_000_000);
    expect(a.highlights.map((h) => h.id)).toContain("career-high");
    expect(a.highlights.find((h) => h.id === "highest-grossing")?.detail).toBe("$1.01B");
  });
  it("never throws on an empty filmography", () => {
    const a = computeActorAnalytics({ actorId: 1, titles: [], credits: [], now: NOW });
    expect(a.counts.features).toBe(0);
    expect(a.ratings.average).toBeNull();
    expect(a.career.startYear).toBeNull();
    expect(a.highlights).toEqual([]);
    expect(a.timeline).toEqual([]);
  });
  it("builds a timeline that always includes the debut and flags top-quartile films", () => {
    const entries = timelineEntries(titles.filter((t) => t.mediaType === "movie" && t.releaseDate! < "2026"), 3);
    expect(entries[0]).toMatchObject({ title: "Debut", isDebut: true });
    expect(entries.find((e) => e.title === "Peak")?.highlight).toBe(true);
    expect(entries.map((e) => e.year)).toEqual([...entries.map((e) => e.year)].sort((a, b) => a - b));
  });
});

describe("filmography sorting and filtering", () => {
  const list = [
    makeTitle({ title: "A", rating: 7, revenue: null, releaseDate: "2001-01-01", popularity: 5 }),
    makeTitle({ title: "B", rating: null, revenue: 500, releaseDate: "2010-01-01", popularity: 50 }),
    makeTitle({ title: "C", rating: 9, revenue: 900, releaseDate: null, popularity: 20, mediaType: "tv", genres: ["Comedy"] }),
  ];
  it("puts missing values last when sorting by rating and revenue", () => {
    expect(sortTitles(list, "rating").map((t) => t.title)).toEqual(["C", "A", "B"]);
    expect(sortTitles(list, "revenue").map((t) => t.title)).toEqual(["C", "B", "A"]);
  });
  it("sorts by date with undated titles last, and never mutates the input", () => {
    const before = list.map((t) => t.title);
    expect(sortTitles(list, "newest").map((t) => t.title)).toEqual(["B", "A", "C"]);
    expect(sortTitles(list, "oldest").map((t) => t.title)).toEqual(["A", "B", "C"]);
    expect(list.map((t) => t.title)).toEqual(before);
  });
  it("filters by media type and genre", () => {
    expect(filterTitles(list, { type: "tv", genre: null }).map((t) => t.title)).toEqual(["C"]);
    expect(filterTitles(list, { type: "all", genre: "Comedy" })).toHaveLength(1);
    expect(filterTitles(list, { type: "movie", genre: "Comedy" })).toHaveLength(0);
  });
  it("lists top genres by frequency", () => expect(topGenres(list)[0]).toBe("Drama"));
});

describe("detail-request selection (API budget)", () => {
  it("caps requests, skips TV / upcoming / cameo-billed films, and prefers popular films", () => {
    const pool = [
      ...Array.from({ length: 60 }, (_, i) => makeTitle({ voteCount: i * 100, billingOrder: 2 })),
      makeTitle({ mediaType: "tv", voteCount: 99_999_999 }),
      makeTitle({ releaseDate: "2027-01-01", voteCount: 99_999_999 }),
      makeTitle({ billingOrder: 40, voteCount: 99_999_999 }),
    ];
    const targets = pickDetailTargets(pool, NOW, 40);
    expect(targets).toHaveLength(40);
    expect(targets.every((t) => t.mediaType === "movie" && (t.billingOrder ?? 0) <= 15)).toBe(true);
    expect(targets[0].voteCount).toBe(5900);
  });
});

describe("awards tally", () => {
  const awards = [
    { body: "academy", outcome: "win", year: 2011, category: "x", work: "y" },
    { body: "academy", outcome: "nomination", year: 2014, category: "x", work: "y" },
    { body: "bafta", outcome: "win", year: 2011, category: "x", work: "y" },
  ] as const;
  it("counts nominations INCLUDING wins", () => {
    expect(tallyAwards(awards, "academy")).toEqual({ wins: 1, nominations: 2 });
    expect(tallyAwards(awards)).toEqual({ wins: 2, nominations: 3 });
    expect(tallyAwards([])).toEqual({ wins: 0, nominations: 0 });
  });
});

describe("formatting", () => {
  it("formats compact currency", () => {
    expect(formatCompactCurrency(1_080_000_000)).toBe("$1.08B");
    expect(formatCompactCurrency(8_400_000_000)).toBe("$8.4B");
    expect(formatCompactCurrency(225_000_000)).toBe("$225M");
    expect(formatCompactCurrency(12_500_000)).toBe("$12.5M");
    expect(formatCompactCurrency(0)).toBe("—");
    expect(formatCompactCurrency(null)).toBe("—");
    expect(formatCompactCurrency(Number.NaN)).toBe("—");
  });
  it("formats dates without time-zone drift", () => {
    expect(formatLongDate("1974-01-30")).toBe("January 30, 1974");
    expect(formatLongDate(null)).toBe("Unknown");
    expect(formatLongDate("garbage")).toBe("Unknown");
  });
  it("computes age, including before/after the birthday", () => {
    expect(ageFrom("1974-01-30", null, new Date("2026-01-29T00:00:00Z"))).toBe(51);
    expect(ageFrom("1974-01-30", null, new Date("2026-01-30T00:00:00Z"))).toBe(52);
    expect(ageFrom("1930-05-01", "2000-04-30")).toBe(69);
    expect(ageFrom(null, null)).toBeNull();
  });
  it("formats year ranges and runtimes", () => {
    expect(formatYearRange(1986, 2024, true)).toBe("1986 – Present");
    expect(formatYearRange(1960, 1975, false)).toBe("1960 – 1975");
    expect(formatYearRange(2004, 2004, false)).toBe("2004");
    expect(formatRuntime(152)).toBe("2h 32m");
    expect(formatRuntime(120)).toBe("2h");
    expect(formatRuntime(0)).toBeNull();
  });
});
