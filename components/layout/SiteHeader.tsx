import Link from "next/link";
import { ActorSearch } from "@/components/search/ActorSearch";

/**
 * Top bar. Sits over the hero (absolute, no background) so the actor imagery runs edge to edge.
 * On the actor page it also carries a compact search so you can jump to another actor.
 */
export function SiteHeader({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link href="/" className="shrink-0 font-display text-3xl italic tracking-tight text-bone" aria-label="Marquee home">
          Marquee
        </Link>
        {withSearch && (
          <div className="min-w-0 max-w-xs flex-1 sm:max-w-sm">
            <ActorSearch variant="compact" />
          </div>
        )}
      </div>
    </header>
  );
}
