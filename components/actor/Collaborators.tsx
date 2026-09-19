import { EmptyState } from "@/components/ui/EmptyState";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { CONFIG } from "@/lib/config";
import type { Collaborator } from "@/types/analytics";

function roleLabel(c: Collaborator): string {
  const isDirector = c.roles.includes("director");
  const isActor = c.roles.includes("actor");
  if (isDirector && isActor) return "Director & co-star";
  return isDirector ? "Director" : "Co-star";
}

/**
 * People this actor keeps working with. Directors and co-stars are ranked together by shared films.
 * Input:  Collaborator[] (already computed, sorted, and limited by the analytics layer)
 */
export function Collaborators({ collaborators, detailedFilms }: { collaborators: Collaborator[]; detailedFilms: number }) {
  if (collaborators.length === 0) {
    return (
      <EmptyState
        title="No repeat collaborators found"
        body={`A collaborator needs at least ${CONFIG.minSharedFilms} shared films among the ${detailedFilms} films analysed in detail.`}
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
      {collaborators.slice(0, 12).map((c) => (
        <li key={c.id} className="group flex flex-col items-center text-center">
          <span className="relative">
            <span className="relative block size-28 overflow-hidden rounded-full bg-panel ring-1 ring-white/10 transition-transform duration-500 ease-[var(--ease-cine)] group-hover:scale-[1.05] sm:size-32">
              <TmdbImage path={c.profilePath} size="w185" alt={c.name} sizes="128px" kind="person" label={c.name} />
            </span>
            <span
              className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-canvas font-display text-xl text-bone ring-1 ring-white/15"
              aria-hidden="true"
            >
              {c.films}
            </span>
          </span>
          <p className="mt-5 text-bone">{c.name}</p>
          <p className="mt-0.5 text-sm text-dim">
            {c.films} films · {roleLabel(c)}
          </p>
          <p className="mt-2 line-clamp-2 max-w-[11rem] text-xs leading-relaxed text-dim/80" title={c.titles.map((t) => t.title).join(", ")}>
            {c.titles.map((t) => t.title).join(", ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
