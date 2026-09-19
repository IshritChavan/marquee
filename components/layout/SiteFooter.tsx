/** Footer. The TMDB attribution is required by TMDB's API terms of use. */
export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-7xl px-5 pb-14 pt-10 sm:px-8">
      <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-8 text-sm leading-relaxed text-dim sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-xl">
          This product uses the TMDB API but is not endorsed or certified by TMDB. Ratings are TMDB user
          scores; IMDb, Rotten Tomatoes and Metascore figures come from OMDb.
        </p>
        <p className="font-display text-xl italic text-mist">Marquee</p>
      </div>
    </footer>
  );
}
