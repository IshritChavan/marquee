import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function NotFound() {
  return (
    <>
      <SiteHeader withSearch />
      <main className="mx-auto flex min-h-[80svh] max-w-xl flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-8xl text-dim">404</p>
        <h1 className="mt-4 font-display text-4xl text-bone">No one by that name</h1>
        <p className="mt-4 leading-relaxed text-mist">
          That page or actor doesn&apos;t exist. Try searching for them by name.
        </p>
        <Link href="/" className="mt-8 rounded-full bg-white/[0.08] px-6 py-3 text-bone transition-colors hover:bg-white/[0.14]">
          Back to home
        </Link>
      </main>
    </>
  );
}
