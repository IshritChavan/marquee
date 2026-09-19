"use client";

import { Bar, BarChart, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { COLORS } from "@/lib/theme";
import { formatCompactCurrency } from "@/lib/utils/formatCurrency";
import type { RevenueEntry } from "@/types/analytics";

const MAX_BARS = 10;

interface Row {
  key: string;
  /** Unique category id for the axis (title + year keeps same-titled films apart). */
  label: string;
  title: string;
  year: number | null;
  revenue: number;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Y-axis label for one bar: the title, with the year on a second line so it never gets truncated. */
function TitleTick({
  x,
  y,
  payload,
  rows,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number; index?: number };
  rows: Row[];
}) {
  const row = rows.find((r) => r.label === String(payload?.value ?? ""));
  if (!row) return <g />;
  return (
    <text x={(x ?? 0) - 8} y={y} textAnchor="end" fill={COLORS.mist} fontSize={13}>
      <tspan x={(x ?? 0) - 8} dy={row.year ? -2 : 4}>
        {truncate(row.title, 22)}
      </tspan>
      {row.year && (
        <tspan x={(x ?? 0) - 8} dy={15} fill={COLORS.dim} fontSize={11.5}>
          {row.year}
        </tspan>
      )}
    </text>
  );
}
/**
 * Horizontal bars of the highest-grossing films.
 * Input:  RevenueEntry[] (already sorted high → low by the analytics layer)
 * Output: bar chart; each bar is labelled with its compact revenue ($1.08B).
 */
export function BoxOfficeChart({ ranking }: { ranking: RevenueEntry[] }) {
  if (ranking.length === 0) {
    return (
      <EmptyState
        title="No box office figures available"
        body="TMDB doesn't report revenue for these films, or the revenue lookups didn't complete."
      />
    );
  }

  const rows: Row[] = ranking.slice(0, MAX_BARS).map((entry) => ({
    key: entry.key,
    label: entry.year ? `${entry.title} (${entry.year})` : entry.title,
    title: entry.title,
    year: entry.year,
    revenue: entry.revenue,
  }));

  return (
    <div
      role="img"
      aria-label={`Bar chart of the ${rows.length} highest-grossing films. Top: ${rows[0].label}, ${formatCompactCurrency(rows[0].revenue)}.`}
      className="w-full"
      style={{ height: rows.length * 46 + 16 }}
    >
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 700, height: rows.length * 46 }}>
        <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }} barCategoryGap={10}>
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis
            type="category"
            dataKey="label"
            width={150}
            axisLine={false}
            tickLine={false}
            tick={<TitleTick rows={rows} />}
            interval={0}
          />
          <Bar
            dataKey="revenue"
            fill={COLORS.ice}
            fillOpacity={0.8}
            radius={[0, 999, 999, 0]}
            barSize={16}
            isAnimationActive
            animationDuration={1100}
            background={{ fill: "rgba(236,231,220,0.035)", radius: 999 }}
          >
            <LabelList
              dataKey="revenue"
              position="right"
              formatter={(value: unknown) => formatCompactCurrency(typeof value === "number" ? value : null)}
              fill={COLORS.bone}
              fontSize={13}
              offset={10}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
