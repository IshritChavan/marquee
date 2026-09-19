import { ArrowUpRight } from "lucide-react";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { ageFrom, formatLongDate, formatYearRange } from "@/lib/utils/formatDate";
import type { Actor } from "@/types/actor";
import type { ActorAnalytics } from "@/types/analytics";
import { Biography } from "./Biography";

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-dim">{label}</dt>
      <dd className="mt-1.5 text-[1.02rem] leading-snug text-bone">{children}</dd>
    </div>
  );
}

/**
 * The cinematic top of the profile.
 * Input:  Actor (identity + images) and the career block of the analytics (for the year range)
 * Output: markup only.
 *
 * The backdrop of their best-known film is laid across the top, faded into the page, and the
 * portrait gets its own blurred halo — so every actor's page is lit by their own imagery.
 */
export function ActorHero({ actor, career }: { actor: Actor; career: ActorAnalytics["career"] }) {
  const age = ageFrom(actor.birthday, actor.deathday);
  const range = formatYearRange(career.startYear, career.endYear, career.isActive);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Backdrop wash */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[46rem] sm:h-[52rem]">
        <div className="relative h-full w-full opacity-[0.34] saturate-[0.85]">
          <TmdbImage
            path={actor.heroBackdropPath ?? actor.profilePath}
            size="w1280"
            alt=""
            sizes="100vw"
            kind="backdrop"
            quiet
            className={actor.heroBackdropPath ? "" : "blur-3xl scale-125"}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-canvas/40 via-canvas/60 to-canvas" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/70 via-transparent to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-32 sm:px-8 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16 lg:pt-40">
        {/* Portrait with halo */}
        <div className="relative mx-auto w-full max-w-[17rem] lg:mx-0 lg:max-w-none">
          <div aria-hidden="true" className="absolute -inset-6 -z-10 opacity-50 blur-3xl">
            <div className="relative h-full w-full">
              <TmdbImage path={actor.profilePath} size="w185" alt="" sizes="200px" kind="person" quiet />
            </div>
          </div>
          <div className="relative aspect-[2/3] overflow-hidden rounded-[2rem] bg-panel shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
            <TmdbImage
              path={actor.profilePath}
              size="w780"
              alt={`Portrait of ${actor.name}`}
              sizes="(min-width: 1024px) 352px, 272px"
              kind="person"
              label={actor.name}
              preload
            />
          </div>
        </div>

        {/* Identity */}
        <div className="flex min-w-0 flex-col justify-end text-center lg:text-left">
          <h1 className="font-display text-[clamp(3.5rem,9vw,7rem)] leading-[0.92] text-bone">{actor.name}</h1>
          <p className="mt-5 text-lg text-mist">{actor.roles.join(" · ")}</p>

          <div className="mt-8 flex justify-center lg:justify-start">
            <Biography text={actor.biography} name={actor.name} />
          </div>

          <dl className="mt-10 grid grid-cols-1 gap-x-10 gap-y-7 text-left sm:grid-cols-2">
            <Fact label="Born">
              {formatLongDate(actor.birthday)}
              {age !== null && !actor.deathday && <span className="text-dim"> · age {age}</span>}
            </Fact>
            {actor.deathday && (
              <Fact label="Died">
                {formatLongDate(actor.deathday)}
                {age !== null && <span className="text-dim"> · aged {age}</span>}
              </Fact>
            )}
            <Fact label="Birthplace">{actor.birthplace ?? <span className="text-dim">Unknown</span>}</Fact>
            <Fact label="Career">
              {range}
              {career.lengthYears > 0 && <span className="text-dim"> · {career.lengthYears} years</span>}
            </Fact>
            {actor.knownFor.length > 0 && (
              <Fact label="Known for">
                <ul className="space-y-0.5">
                  {actor.knownFor.slice(0, 4).map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
              </Fact>
            )}
          </dl>

          {actor.links.length > 0 && (
            <ul className="mt-10 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              {actor.links.map((link) => (
                <li key={link.kind}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2 text-sm text-bone transition-colors duration-300 hover:bg-white/[0.12]"
                  >
                    {link.label}
                    <ArrowUpRight className="size-3.5 text-dim" strokeWidth={1.75} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
