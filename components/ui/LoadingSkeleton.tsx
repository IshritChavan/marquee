/** Skeleton primitives and page-level skeletons. Shapes mirror the real layout to avoid layout shift. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

export function SearchResultsSkeleton() {
  return (
    <ul className="flex flex-col gap-1 p-2" aria-label="Loading results">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex items-center gap-4 rounded-2xl px-3 py-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-md" />
            <Skeleton className="h-3 w-56 max-w-full rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-label="Loading trending actors">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="aspect-[2/3] w-44 shrink-0 rounded-3xl sm:w-56" />
      ))}
    </div>
  );
}

/** Shown by app/actor/[id]/loading.tsx while the profile is being built. */
export function ActorPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-5 pt-32 sm:px-8" role="status" aria-label="Loading actor profile">
      <div className="grid gap-12 lg:grid-cols-[360px_1fr]">
        <Skeleton className="mx-auto aspect-[2/3] w-full max-w-[260px] rounded-[2rem] lg:max-w-none" />
        <div className="space-y-6">
          <Skeleton className="h-24 w-full max-w-xl rounded-2xl" />
          <Skeleton className="h-8 w-40 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
            <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
            <Skeleton className="h-4 w-2/3 max-w-xl rounded-md" />
          </div>
          <div className="grid max-w-xl grid-cols-2 gap-6 pt-4">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-16 h-36 w-full rounded-3xl" />
      <Skeleton className="mt-16 h-96 w-full rounded-3xl" />
    </div>
  );
}
