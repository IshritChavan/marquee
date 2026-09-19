import { AnimatedNumber, type NumberKind } from "./AnimatedNumber";

/**
 * One headline statistic: a large serif number, a label, and an optional footnote.
 * `value === null` means "we don't have this" — shown as an em dash, never as 0.
 */
export function MetricCard({
  label,
  value,
  kind = "integer",
  suffix,
  caption,
  tone = "default",
}: {
  label: string;
  value: number | null;
  kind?: NumberKind;
  suffix?: string;
  caption?: string;
  /** "gilt" is reserved for award wins. */
  tone?: "default" | "gilt";
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-6 py-7 sm:px-7">
      <div
        className={`font-display text-5xl leading-none sm:text-6xl ${tone === "gilt" ? "text-gilt" : "text-bone"}`}
      >
        {value === null ? <span className="text-dim">—</span> : <AnimatedNumber value={value} kind={kind} suffix={suffix} />}
      </div>
      <div className="text-[0.95rem] text-bone/90">{label}</div>
      {caption && <div className="text-sm leading-snug text-dim">{caption}</div>}
    </div>
  );
}
