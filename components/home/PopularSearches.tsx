import Link from "next/link";
import { connection } from "next/server";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { Reveal } from "@/components/ui/Reveal";
import { getPopularSearchActors } from "@/lib/services/homeService";

/** Quick links to a few well-known careers. Names live in lib/config.ts and are resolved to ids server-side. */
export async function PopularSearches() {
  await connection();

  const actors = await getPopularSearchActors();
  if (actors.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-5 pb-28 pt-4 sm:px-8">
      <Reveal>
        <h2 className="font-display text-3xl text-bone sm:text-4xl">Start with a career</h2>
        <ul className="mt-8 flex flex-wrap gap-3">
          {actors.map((actor) => (
            <li key={actor.id}>
              <Link
                href={`/actor/${actor.id}`}
                className="group flex items-center gap-3 rounded-full bg-white/[0.05] py-2 pl-2 pr-5 transition-colors duration-300 hover:bg-white/[0.1]"
              >
                <span className="relative size-9 overflow-hidden rounded-full bg-lift">
                  <TmdbImage path={actor.profilePath} size="w92" alt="" sizes="36px" kind="person" label={actor.name} />
                </span>
                <span className="text-[0.95rem] text-bone">{actor.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
