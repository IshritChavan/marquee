import { SiteHeader } from "@/components/layout/SiteHeader";
import { ActorPageSkeleton } from "@/components/ui/LoadingSkeleton";

/** Shown instantly while the profile is being assembled on the server (first visit takes a few seconds). */
export default function Loading() {
  return (
    <>
      <SiteHeader withSearch />
      <ActorPageSkeleton />
    </>
  );
}
