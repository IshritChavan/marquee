"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ActorSearchResult } from "@/types/search";
import { optionId, SearchResults, type SearchState } from "./SearchResults";

/** Wait this long after the last keystroke before calling the API. */
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

interface SearchErrorBody {
  error?: { message?: string };
}
interface SearchOkBody {
  results?: ActorSearchResult[];
}

/**
 * Autocomplete actor search.
 *
 * Flow: keystroke → (300ms of quiet) → GET /api/search?q=… → dropdown → pick → /actor/[id]
 *
 * Request hygiene:
 *  - debounced, so typing "christian" sends one request, not nine
 *  - the previous in-flight request is aborted when a new one starts (no out-of-order results)
 *  - answers are remembered per query for the lifetime of the page
 *
 * All state changes happen in event handlers rather than effects — simpler to reason about.
 */
export function ActorSearch({
  variant = "hero",
  autoFocus = false,
}: {
  variant?: "hero" | "compact";
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const memoRef = useRef(new Map<string, ActorSearchResult[]>());

  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isHero = variant === "hero";
  const results = state.status === "results" ? state.results : [];

  const fetchResults = useCallback(async (q: string) => {
    const key = q.toLowerCase();
    const remembered = memoRef.current.get(key);
    if (remembered) {
      setState(remembered.length > 0 ? { status: "results", results: remembered } : { status: "empty", query: q });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      const body = (await response.json()) as SearchOkBody & SearchErrorBody;
      if (!response.ok) {
        setState({ status: "error", message: body.error?.message ?? "Search is unavailable right now." });
        return;
      }
      const found = body.results ?? [];
      memoRef.current.set(key, found);
      setActiveIndex(-1);
      setState(found.length > 0 ? { status: "results", results: found } : { status: "empty", query: q });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // superseded by a newer query
      setState({ status: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    setActiveIndex(-1);
    if (timerRef.current) clearTimeout(timerRef.current);

    const q = value.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setState({ status: "idle" });
      return;
    }
    setState({ status: "loading" });
    timerRef.current = setTimeout(() => void fetchResults(q), DEBOUNCE_MS);
  }

  function select(person: ActorSearchResult) {
    setOpen(false);
    setQuery(person.name);
    router.push(`/actor/${person.id}`);
  }

  function clear() {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    setQuery("");
    setState({ status: "idle" });
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (results.length === 0) return;
      event.preventDefault();
      setOpen(true);
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => (current + step + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      // Enter picks the highlighted row, or the top result if nothing is highlighted.
      const chosen = results[activeIndex] ?? results[0];
      if (chosen) {
        event.preventDefault();
        select(chosen);
      }
    }
  }

  // Close the dropdown when clicking anywhere outside it. Also clean up timers on unmount.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const showPanel = open && state.status !== "idle";

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`group flex items-center gap-3 bg-white/[0.06] backdrop-blur-xl transition-colors duration-300 focus-within:bg-white/[0.09] ${
          isHero ? "h-16 rounded-full px-6 sm:h-[4.5rem] sm:px-8" : "h-11 rounded-full px-4"
        }`}
      >
        <Search className={`shrink-0 text-dim ${isHero ? "size-5" : "size-4"}`} strokeWidth={1.75} aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-label="Search for an actor"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isHero ? "Search Christian Bale, Margot Robbie, Leonardo DiCaprio…" : "Search actors"}
          // The global :focus-visible ring is replaced by the pill's own focus-within background.
          className={`min-w-0 flex-1 bg-transparent text-bone outline-none placeholder:text-dim focus-visible:outline-none ${
            isHero ? "text-base sm:text-lg" : "text-[0.95rem]"
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-dim transition-colors hover:bg-white/10 hover:text-bone"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 top-full z-50 mt-3 max-h-[70vh] overflow-y-auto rounded-[1.75rem] bg-panel/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <SearchResults
              state={state}
              activeIndex={activeIndex}
              listboxId={listboxId}
              onSelect={select}
              onHover={setActiveIndex}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
