/**
 * Mock TMDB server — for developing and testing WITHOUT a real API key or internet access.
 *
 *   Terminal 1:  npm run mock
 *   Terminal 2:  TMDB_API_KEY=anything TMDB_BASE_URL=http://localhost:4010/3 npm run dev
 *
 * It speaks just enough of the TMDB v3 API for this app: person search, trending people,
 * person details (+ combined_credits, external_ids) and movie details (+ credits).
 *
 * All data is SYNTHETIC and generated from a seeded random generator, so it is identical on every run.
 * Film titles are fake ("The Last Harbour"…). Real names appear only so the landing-page chips and
 * the sample awards data can be exercised — nothing here describes a real person's career.
 *
 * Optional: MOCK_RATE_LIMIT=0.25 makes 25% of /movie requests return HTTP 429,
 * to test the "partial data" warning path.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 4010);
const RATE_LIMIT = Number(process.env.MOCK_RATE_LIMIT ?? 0);

/** Small deterministic PRNG (mulberry32): same seed → same sequence. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, list) => list[Math.floor(r() * list.length)];

const ROSTER = [
  { id: 1, name: "Christian Bale", born: "1974-01-30", place: "Haverfordwest, Wales, UK", start: 1987 },
  { id: 2, name: "Margot Robbie", born: "1990-07-02", place: "Dalby, Queensland, Australia", start: 2008 },
  { id: 3, name: "Leonardo DiCaprio", born: "1974-11-11", place: "Los Angeles, California, USA", start: 1991 },
  { id: 4, name: "Cillian Murphy", born: "1976-05-25", place: "Douglas, Cork, Ireland", start: 1997 },
  { id: 5, name: "Florence Pugh", born: "1996-01-03", place: "Oxford, England, UK", start: 2014 },
  { id: 6, name: "Robert Downey Jr.", born: "1965-04-04", place: "Manhattan, New York, USA", start: 1970 },
  // Deliberately sparse: no biography, no photo, no external ids, almost no credits.
  { id: 7, name: "Sparse Sample", born: null, place: null, start: 2019, sparse: true },
];

const TITLE_A = ["The Last", "Winter", "Silent", "A Quiet", "Broken", "Northern", "The Glass", "Midnight", "Iron", "Paper", "Hollow", "Distant", "The Long", "Burning", "Salt"];
const TITLE_B = ["Harbour", "Orchard", "Signal", "Kingdom", "Meridian", "Letters", "Garden", "Protocol", "Season", "Tide", "Verdict", "Frontier", "Return", "Highway", "Hours"];
const CHARACTERS = ["Detective Marsh", "Elias Crane", "Dr. Vale", "Captain Ross", "Nora Lind", "Tom Harker", "The Stranger", "Jack Mercer", "Lena Ward", "Officer Bell", "Victor Hale", "Sam Doyle"];
const DIRECTORS = ["Ada Lindqvist", "Marcus Oyelaran", "Helena Voss", "Rafael Ortega", "Ingrid Solheim", "Daniel Park"];
const COSTARS = [
  "Amelia Hart", "Idris Bello", "Sofia Marin", "Owen Falk", "Priya Nair", "Callum Reid", "Yara Haddad", "Theo Lang", "Mina Sato", "Bruno Keller",
  "Grace Odell", "Felix Anders", "Noor Rahman", "Hugo Bassett", "Clara Weiss", "Jonah Pike",
];
const MOVIE_GENRE_IDS = [18, 18, 18, 28, 53, 35, 80, 878, 12, 9648, 10749, 36, 10752];

const personName = (id) => (id >= 9000 ? DIRECTORS[id - 9000] : COSTARS[id - 8000]);

/** Deterministic film for (actor, index). Movie ids encode both: id = actorId*1000 + index. */
function film(actor, index) {
  const r = rng(actor.id * 7919 + index * 104729);
  const id = actor.id * 1000 + index;
  const year = actor.start + Math.floor(r() * (2026 - actor.start));
  const month = 1 + Math.floor(r() * 12);
  const day = 1 + Math.floor(r() * 28);
  const popularityTier = r();
  const votes = Math.floor(200 + popularityTier ** 2 * 32000);
  const rating = Math.round((4.6 + r() * 4.2 + popularityTier * 0.6) * 10) / 10;
  const genres = [pick(r, MOVIE_GENRE_IDS)];
  if (r() < 0.55) genres.push(pick(r, MOVIE_GENRE_IDS));
  const hasRevenue = r() > 0.15;
  return {
    id,
    title: `${pick(r, TITLE_A)} ${pick(r, TITLE_B)}${index % 9 === 0 ? " II" : ""}`,
    release_date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    character: pick(r, CHARACTERS),
    order: Math.floor(r() * (popularityTier > 0.4 ? 5 : 20)),
    vote_average: Math.min(9.3, Math.max(3.2, rating)),
    vote_count: votes,
    popularity: Math.round(popularityTier * 900) / 10 + 2,
    genre_ids: [...new Set(genres)],
    poster_path: r() > 0.08 ? `/mock-poster-${id}.jpg` : null,
    backdrop_path: r() > 0.2 ? `/mock-backdrop-${id}.jpg` : null,
    overview: `A synthetic plot for testing. ${pick(r, ["A detective returns to a town that never forgave him.", "Two strangers share one night that changes both lives.", "A crew of specialists takes one last job.", "An expedition goes wrong in the far north."])}`,
    revenue: hasRevenue ? Math.round((1e6 + popularityTier ** 3 * 9e8) * (0.6 + r())) : 0,
    budget: hasRevenue ? Math.round(5e6 + r() * 1.2e8) : 0,
    runtime: 84 + Math.floor(r() * 90),
    director: 9000 + Math.floor(r() ** 1.6 * DIRECTORS.length),
    costars: Array.from({ length: 4 + Math.floor(r() * 4) }, () => 8000 + Math.floor(r() ** 1.5 * COSTARS.length)),
    imdb_id: `tt${String(9000000 + id).padStart(7, "0")}`,
  };
}

function filmCount(actor) {
  if (actor.sparse) return 2;
  return 34 + (actor.id % 4) * 4;
}

function personDetails(actor) {
  const cast = [];
  for (let i = 0; i < filmCount(actor); i++) {
    const f = film(actor, i);
    cast.push({
      id: f.id,
      media_type: "movie",
      title: f.title,
      character: f.character,
      release_date: f.release_date,
      vote_average: f.vote_average,
      vote_count: f.vote_count,
      popularity: f.popularity,
      genre_ids: f.genre_ids,
      poster_path: f.poster_path,
      backdrop_path: f.backdrop_path,
      overview: f.overview,
      order: f.order,
    });
  }
  if (!actor.sparse) {
    // Edge cases the analytics must cope with:
    cast.push({ id: actor.id * 1000 + 900, media_type: "movie", title: "Untitled Future Project", character: "TBA", release_date: "2027-11-05", vote_average: 0, vote_count: 0, popularity: 9, genre_ids: [18], poster_path: null, backdrop_path: null, overview: "", order: 1 });
    cast.push({ id: actor.id * 1000 + 901, media_type: "movie", title: "Behind the Scenes: A Retrospective", character: "Himself", release_date: "2015-06-01", vote_average: 6.1, vote_count: 400, popularity: 4, genre_ids: [99], poster_path: null, backdrop_path: null, overview: "Documentary appearance.", order: 0 });
    for (let t = 0; t < 3; t++) {
      cast.push({ id: actor.id * 1000 + 950 + t, media_type: "tv", name: `Mock Series ${t + 1}`, character: pick(rng(actor.id + t), CHARACTERS), first_air_date: `${2010 + t * 3}-09-15`, vote_average: 7.4 + t * 0.3, vote_count: 900 + t * 300, popularity: 20 + t * 5, genre_ids: [18, 80], poster_path: `/mock-tv-${t}.jpg`, backdrop_path: null, overview: "A synthetic television series.", episode_count: 8 + t * 4 });
    }
  } else {
    cast[1].vote_count = 3; // too few votes → "unrated"
    cast[1].poster_path = null;
    cast[1].revenue = 0;
  }
  return {
    id: actor.id,
    name: actor.name,
    biography: actor.sparse ? "" : `MOCK DATA: this profile was generated by scripts/mock-tmdb.mjs for offline testing and does not describe a real career. ${actor.name} appears here in ${filmCount(actor)} synthetic films so the charts and analytics have something to show.\n\nThe second paragraph exists to test the "Read more" toggle in the biography: it is long enough that the text is clamped to five lines on most screens, and expanding it reveals everything that TMDB returned for this person.`,
    birthday: actor.born,
    deathday: null,
    place_of_birth: actor.place,
    profile_path: actor.sparse ? null : `/mock-profile-${actor.id}.jpg`,
    known_for_department: "Acting",
    homepage: null,
    also_known_as: [],
    combined_credits: { cast, crew: actor.sparse ? [] : [{ id: actor.id * 1000 + 3, media_type: "movie", job: "Producer", department: "Production" }, { id: actor.id * 1000 + 5, media_type: "movie", job: "Producer", department: "Production" }, { id: actor.id * 1000 + 7, media_type: "movie", job: "Producer", department: "Production" }] },
    external_ids: actor.sparse ? {} : { imdb_id: `nm${String(1000000 + actor.id)}`, instagram_id: "mock_account", twitter_id: null, facebook_id: null },
  };
}

function listItem(actor) {
  const known = actor.sparse ? [] : [0, 1, 2].map((i) => ({ id: film(actor, i).id, media_type: "movie", title: film(actor, i).title }));
  return { id: actor.id, name: actor.name, profile_path: actor.sparse ? null : `/mock-profile-${actor.id}.jpg`, known_for_department: "Acting", popularity: 50 - actor.id, known_for: known };
}

function movieDetails(id) {
  const actor = ROSTER.find((a) => a.id === Math.floor(id / 1000));
  const index = id % 1000;
  if (!actor || index >= filmCount(actor)) return null;
  const f = film(actor, index);
  const genreName = { 18: "Drama", 28: "Action", 53: "Thriller", 35: "Comedy", 80: "Crime", 878: "Science Fiction", 12: "Adventure", 9648: "Mystery", 10749: "Romance", 36: "History", 10752: "War" };
  const person = (pid, order) => ({ id: pid, name: personName(pid), profile_path: `/mock-person-${pid}.jpg`, order });
  return {
    id,
    title: f.title,
    tagline: "A synthetic tagline for testing.",
    overview: f.overview,
    release_date: f.release_date,
    runtime: f.runtime,
    revenue: f.revenue,
    budget: f.budget,
    imdb_id: f.imdb_id,
    genres: f.genre_ids.map((g) => ({ id: g, name: genreName[g] ?? "Drama" })),
    credits: {
      cast: [
        { id: actor.id, name: actor.name, profile_path: `/mock-profile-${actor.id}.jpg`, order: f.order, character: f.character },
        ...[...new Set(f.costars)].map((pid, i) => ({ ...person(pid, i + 1), character: "Supporting" })),
      ],
      crew: [{ id: f.director, name: personName(f.director), profile_path: `/mock-person-${f.director}.jpg`, job: "Director" }],
    },
  };
}

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname.replace(/^\/3/, "");
  const hasKey = url.searchParams.has("api_key") || (req.headers.authorization ?? "").startsWith("Bearer ");
  console.log(`${req.method} ${req.url?.replace(/api_key=[^&]+/, "api_key=***")}`);

  if (!hasKey) return send(res, 401, { status_message: "Invalid API key: mock server requires any api_key value." });

  if (path === "/search/person") {
    const q = (url.searchParams.get("query") ?? "").toLowerCase();
    const results = ROSTER.filter((a) => a.name.toLowerCase().includes(q)).map(listItem);
    return send(res, 200, { page: 1, results, total_results: results.length });
  }
  if (path === "/trending/person/week") {
    return send(res, 200, { page: 1, results: ROSTER.filter((a) => !a.sparse).map(listItem), total_results: ROSTER.length - 1 });
  }
  const person = /^\/person\/(\d+)$/.exec(path);
  if (person) {
    const actor = ROSTER.find((a) => a.id === Number(person[1]));
    return actor ? send(res, 200, personDetails(actor)) : send(res, 404, { status_message: "The resource you requested could not be found." });
  }
  const movie = /^\/movie\/(\d+)$/.exec(path);
  if (movie) {
    if (RATE_LIMIT > 0 && Math.random() < RATE_LIMIT) return send(res, 429, { status_message: "Too many requests" });
    const details = movieDetails(Number(movie[1]));
    return details ? send(res, 200, details) : send(res, 404, { status_message: "The resource you requested could not be found." });
  }
  return send(res, 404, { status_message: "Not implemented in the mock" });
});

server.listen(PORT, () => {
  console.log(`\nMock TMDB listening on http://localhost:${PORT}/3`);
  console.log("Start the app with:  TMDB_API_KEY=anything TMDB_BASE_URL=http://localhost:4010/3 npm run dev\n");
  console.log("Actors:", ROSTER.map((a) => `${a.id}:${a.name}`).join(", "));
});
