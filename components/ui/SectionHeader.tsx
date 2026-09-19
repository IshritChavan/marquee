/** Title block for each profile section. Big serif title, quiet supporting text, optional right slot. */
export function SectionHeader({
  title,
  description,
  aside,
  headingId,
}: {
  title: string;
  description?: string;
  aside?: React.ReactNode;
  /** id for the <h2>, so a parent <section aria-labelledby> can point at it. */
  headingId?: string;
}) {
  return (
    <div className="mb-10 flex flex-col gap-5 md:mb-12 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <h2 id={headingId} className="font-display text-4xl leading-[1.05] text-bone sm:text-5xl">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-base leading-relaxed text-mist">{description}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
