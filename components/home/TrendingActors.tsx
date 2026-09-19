import Link from "next/link";
import { connection } from "next/server";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { getTrendingActors } from "@/lib/services/homeService";

/**
 * Trending actors this week. An async Server Component: it fetches on the server and streams in
 * behind a <Suspense> boundary, so the hero never waits for it.
 * If TMDB is unreachable the section simply doesn't render — the landing page must never break.
 */
export async function TrendingActors() {
  // Opt out of build-time prerendering: this list must be fetched per request, not frozen at build.
  await connection();

  const actors = await getTrendingActors(10).catch(() => []);
  if (actors.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
      <Reveal>
        <SectionHeader title="Trending this week" description="The most-searched names on TMDB right now." />
      </Reveal>
      <Reveal delay={0.05}>
        <ul className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:gap-5 sm:px-8">
          {actors.map((actor) => (
            <li key={actor.id} className="w-40 shrink-0 snap-start sm:w-52">
              <Link href={`/actor/${actor.id}`} className="group block">
                <span className="relative block aspect-[2/3] overflow-hidden rounded-3xl bg-panel transition-transform duration-500 ease-[var(--ease-cine)] group-hover:-translate-y-1.5">
                  <TmdbImage
                    path={actor.profilePath}
                    size="w342"
                    alt={actor.name}
                    sizes="(min-width: 640px) 208px, 160px"
                    kind="person"
                    label={actor.name}
                    className="transition-transform duration-700 ease-[var(--ease-cine)] group-hover:scale-[1.04]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"
                  />
                </span>
                <span className="mt-4 block truncate text-bone">{actor.name}</span>
                <span className="block truncate text-sm text-dim">{actor.knownFor.slice(0, 2).join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
