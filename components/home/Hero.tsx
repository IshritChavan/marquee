import { TmdbImage } from "@/components/ui/TmdbImage";
import { ActorSearch } from "@/components/search/ActorSearch";
import type { ActorSearchResult } from "@/types/search";

/**
 * Landing hero.
 *
 * Design idea: "the actor's imagery is the only light". The `glow` slot receives blurred trending
 * portraits (see HeroGlow) that become soft, desaturated pools of colour behind the headline.
 * It streams in separately, so the headline and search box render instantly and never remount
 * (a remount would wipe whatever the visitor had already typed).
 * Without portraits (no API key yet) a single projector-style light cone remains.
 */
export function Hero({ glow }: { glow?: React.ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden">
      {glow}

      {/* Projector cone from above, and a fade into the page below. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_50%_-10%,rgba(236,231,220,0.10),transparent_70%),linear-gradient(to_bottom,rgba(18,19,22,0.35),var(--color-canvas)_96%)]"
      />

      <div className="mx-auto flex min-h-[88svh] max-w-5xl flex-col items-center justify-center px-5 pb-24 pt-32 text-center sm:px-8">
        <h1 className="font-display text-[clamp(3.25rem,9vw,7.25rem)] leading-[0.95] text-bone">
          Explore the numbers
          <br />
          behind the <em className="italic text-bone/80">stars.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-mist sm:text-xl">
          Discover actor careers, ratings, box office performance, awards, collaborations, and more.
        </p>
        <div className="mt-12 w-full max-w-2xl">
          <ActorSearch variant="hero" />
        </div>
      </div>
    </section>
  );
}

/** Blurred trending portraits used as ambient light. Decorative only (aria-hidden). */
export function HeroGlowImages({ actors }: { actors: ActorSearchResult[] }) {
  const glow = actors.filter((a) => a.profilePath).slice(0, 3);
  if (glow.length === 0) return null;
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-20 flex justify-around opacity-[0.28]">
      {glow.map((actor, i) => (
        <div
          key={actor.id}
          className={`relative h-[120%] w-1/2 -translate-y-[10%] scale-125 blur-[70px] saturate-[0.7] ${
            i === 1 ? "hidden sm:block" : ""
          } ${i === 2 ? "hidden lg:block" : ""}`}
        >
          <TmdbImage path={actor.profilePath} size="w185" alt="" sizes="30vw" kind="backdrop" quiet />
        </div>
      ))}
    </div>
  );
}
