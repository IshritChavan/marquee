"use client";

import { SearchX, TriangleAlert } from "lucide-react";
import { SearchResultsSkeleton } from "@/components/ui/LoadingSkeleton";
import { TmdbImage } from "@/components/ui/TmdbImage";
import type { ActorSearchResult } from "@/types/search";

/**
 * Everything the dropdown can be showing. A discriminated union means the component below
 * can't render "results" without having results — TypeScript enforces it.
 */
export type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "results"; results: ActorSearchResult[] }
  | { status: "empty"; query: string }
  | { status: "error"; message: string };

export function optionId(listboxId: string, index: number): string {
  return `${listboxId}-option-${index}`;
}

/**
 * The dropdown body: loading skeleton, result rows, empty state or error.
 * Input:  the current SearchState + which row is keyboard-highlighted
 * Output: `onSelect(result)` when a row is chosen (mouse or keyboard, handled by the parent)
 */
export function SearchResults({
  state,
  activeIndex,
  listboxId,
  onSelect,
  onHover,
}: {
  state: SearchState;
  activeIndex: number;
  listboxId: string;
  onSelect: (result: ActorSearchResult) => void;
  onHover: (index: number) => void;
}) {
  if (state.status === "loading") return <SearchResultsSkeleton />;

  if (state.status === "empty") {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-10 text-center" role="status">
        <SearchX className="size-6 text-dim" strokeWidth={1.5} />
        <p className="text-bone">No actors found for &ldquo;{state.query}&rdquo;</p>
        <p className="max-w-xs text-sm text-dim">Check the spelling, or try a last name only.</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex items-start gap-4 px-6 py-7" role="alert">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-copper" strokeWidth={1.5} />
        <p className="text-sm leading-relaxed text-mist">{state.message}</p>
      </div>
    );
  }

  if (state.status !== "results") return null;

  return (
    <ul id={listboxId} role="listbox" aria-label="Actors" className="flex flex-col p-2">
      {state.results.map((person, index) => {
        const active = index === activeIndex;
        return (
          <li
            key={person.id}
            id={optionId(listboxId, index)}
            role="option"
            aria-selected={active}
            // onMouseDown (not onClick) fires before the input's blur, so the dropdown doesn't close first.
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(person);
            }}
            onMouseMove={() => onHover(index)}
            className={`flex cursor-pointer items-center gap-4 rounded-2xl px-3 py-3 transition-colors duration-200 ${
              active ? "bg-white/[0.07]" : ""
            }`}
          >
            <span className="relative size-12 shrink-0 overflow-hidden rounded-full bg-lift">
              <TmdbImage
                path={person.profilePath}
                size="w185"
                alt=""
                sizes="48px"
                kind="person"
                label={person.name}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[1.02rem] text-bone">{person.name}</span>
              <span className="block truncate text-sm text-dim">
                {person.profession}
                {person.knownFor.length > 0 && (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="text-mist/80">Known for: {person.knownFor.join(", ")}</span>
                  </>
                )}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
