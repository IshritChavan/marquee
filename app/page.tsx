import { Suspense } from "react";
import { connection } from "next/server";
import { Hero, HeroGlowImages } from "@/components/home/Hero";
import { PopularSearches } from "@/components/home/PopularSearches";
import { SetupNotice } from "@/components/home/SetupNotice";
import { TrendingActors } from "@/components/home/TrendingActors";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TrendingSkeleton } from "@/components/ui/LoadingSkeleton";
import { getTrendingActors } from "@/lib/services/homeService";

/** Landing page: hero + search, then trending actors and quick links streamed in below. */
async function HeroGlow() {
  await connection();
  const trending = await getTrendingActors(10).catch(() => []);
  return <HeroGlowImages actors={trending} />;
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Cached after the first call, so this shares its data with the Trending section for free. */}
        <Hero
          glow={
            <Suspense>
              <HeroGlow />
            </Suspense>
          }
        />
        <Suspense>
          <SetupNotice />
        </Suspense>
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
              <TrendingSkeleton />
            </div>
          }
        >
          <TrendingActors />
        </Suspense>
        <Suspense>
          <PopularSearches />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
