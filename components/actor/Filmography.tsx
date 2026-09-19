"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { MovieCard } from "@/components/movie/MovieCard";
import { MovieModal } from "@/components/movie/MovieModal";
import { filterTitles, SORT_OPTIONS, sortTitles, topGenres, type SortKey, type TypeFilter } from "@/lib/analytics";
import type { Title } from "@/types/movie";

const PAGE_SIZE = 20;

const TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV" },
];

/** A single pill in a filter group. `aria-pressed` makes the selected state audible, not just visible. */
function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors duration-300 ${
        selected ? "bg-bone text-canvas" : "bg-white/[0.06] text-mist hover:bg-white/[0.11] hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The filmography: sort, filter (type + genre), paginated poster grid, and the detail modal.
 * Input:  every Title we have.  Sorting/filtering logic lives in lib/analytics/filmography.ts.
 * State is all local UI state: sort key, type filter, genre filter, how many cards are shown, open title.
 */
export function Filmography({ titles }: { titles: Title[] }) {
  const [sort, setSort] = useState<SortKey>("popularity");
  const [type, setType] = useState<TypeFilter>("all");
  const [genre, setGenre] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [open, setOpen] = useState<Title | null>(null);

  const genres = useMemo(() => topGenres(titles, 8), [titles]);
  const hasTv = useMemo(() => titles.some((t) => t.mediaType === "tv"), [titles]);
  const filtered = useMemo(() => sortTitles(filterTitles(titles, { type, genre }), sort), [titles, type, genre, sort]);
  const shown = filtered.slice(0, visible);

  // Any change to the filters or sort starts again from the first page.
  function change<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setVisible(PAGE_SIZE);
  }

  if (titles.length === 0) {
    return <EmptyState title="No filmography found" body="TMDB doesn't list any acting credits for this person." />;
  }

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {hasTv ? (
            <div className="flex gap-2" role="group" aria-label="Filter by type">
              {TYPE_OPTIONS.map((option) => (
                <Chip key={option.id} selected={type === option.id} onClick={() => change(setType, option.id)}>
                  {option.label}
                </Chip>
              ))}
            </div>
          ) : (
            <span />
          )}
          <label className="flex items-center gap-3 text-sm text-dim">
            Sort by
            <select
              value={sort}
              onChange={(event) => change(setSort, event.target.value as SortKey)}
              className="cursor-pointer rounded-full bg-white/[0.06] py-2 pl-4 pr-9 text-sm text-bone outline-none transition-colors hover:bg-white/[0.1] focus-visible:outline-2"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.id} value={option.id} className="bg-panel text-bone">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {genres.length > 0 && (
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by genre">
            <Chip selected={genre === null} onClick={() => change(setGenre, null)}>
              All genres
            </Chip>
            {genres.map((name) => (
              <Chip key={name} selected={genre === name} onClick={() => change(setGenre, genre === name ? null : name)}>
                {name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nothing matches these filters" body="Try a different genre or switch back to All." />
      ) : (
        <>
          <p className="mb-6 text-sm text-dim" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "title" : "titles"}
            {sort === "revenue" && " · revenue is only known for films analysed in detail"}
          </p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 xl:grid-cols-5">
            {shown.map((title) => (
              <li key={title.key}>
                <MovieCard title={title} onOpen={setOpen} />
              </li>
            ))}
          </ul>
          {filtered.length > shown.length && (
            <div className="mt-14 flex justify-center">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="rounded-full bg-white/[0.07] px-7 py-3 text-bone transition-colors duration-300 hover:bg-white/[0.13]"
              >
                Show more ({filtered.length - shown.length} left)
              </button>
            </div>
          )}
        </>
      )}

      {/* key= remounts the modal for each film, so its "loading" state always starts fresh. */}
      {open && <MovieModal key={open.key} title={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
