/** Trim trailing zeros: 1.50 → "1.5", 2.00 → "2". */
function trim(n: number, maxDecimals: number): string {
  return Number(n.toFixed(maxDecimals)).toString();
}

/**
 * Compact currency for cards and charts: $1.08B, $225M, $12.5K.
 * Returns "—" for missing values so callers never render "$NaN".
 */
export function formatCompactCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1e9) return `$${trim(value / 1e9, 2)}B`;
  if (value >= 1e8) return `$${trim(value / 1e6, 0)}M`;
  if (value >= 1e6) return `$${trim(value / 1e6, 1)}M`;
  if (value >= 1e3) return `$${trim(value / 1e3, 1)}K`;
  return `$${Math.round(value)}`;
}

/** Full currency, e.g. $1,006,234,167 — used in tooltips and the modal. */
export function formatFullCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
