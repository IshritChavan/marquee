/** A labelled fact with a supporting line: "Most common genre — Drama — 18 films". */
export function InsightStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | null;
  detail?: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-dim">{label}</dt>
      <dd className="mt-1.5">
        <span className="block font-display text-3xl leading-tight text-bone">{value ?? <span className="text-dim">—</span>}</span>
        {detail && <span className="mt-1 block text-sm text-mist">{detail}</span>}
      </dd>
    </div>
  );
}
