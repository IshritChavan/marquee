"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, XAxis, YAxis } from "recharts";
import type { ScatterShapeProps } from "recharts";
import { Star } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { TmdbImage } from "@/components/ui/TmdbImage";
import { COLORS } from "@/lib/theme";
import type { RatingPoint } from "@/types/analytics";

interface HoverState {
  point: RatingPoint;
  cx: number;
  cy: number;
  /** Width of the chart container when the hover started; used to keep the tooltip on-screen. */
  width: number;
}

interface AxisConfig {
  xDomain: [number, number];
  xTicks: number[];
  yDomain: [number, number];
  yTicks: number[];
  minYear: number;
  maxYear: number;
  minRating: number;
  maxRating: number;
}

const TOOLTIP_W = 264;
// Module-level constants: identical object identity on every render keeps Recharts from recomputing.
const MARGIN = { top: 16, right: 16, bottom: 4, left: -8 };
const TICK = { fill: COLORS.dim, fontSize: 12 };
const INITIAL_SIZE = { width: 900, height: 440 };

/** Ticks at multiples of `step` inside [lo, hi]. */
function multiplesOf(step: number, lo: number, hi: number): number[] {
  const ticks: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi; t += step) ticks.push(t);
  return ticks;
}

function buildAxes(points: RatingPoint[]): AxisConfig {
  const years = points.map((p) => p.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const span = maxYear - minYear;
  const step = span > 35 ? 10 : span > 18 ? 5 : span > 8 ? 2 : 1;
  const xDomain: [number, number] = [minYear - 1, maxYear + 1];

  const ratings = points.map((p) => p.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const yLo = Math.max(0, Math.floor(minRating) - 1);
  const yHi = Math.min(10, Math.ceil(maxRating) + 1);

  return {
    xDomain,
    xTicks: multiplesOf(step, xDomain[0], xDomain[1]),
    yDomain: [yLo, yHi],
    yTicks: multiplesOf(1, yLo, yHi),
    minYear,
    maxYear,
    minRating,
    maxRating,
  };
}

/**
 * The Recharts tree, isolated in a memo component.
 *
 * Why: hovering a dot changes state in the parent (to show the tooltip). Without this boundary the
 * whole chart re-rendered on every hover, Recharts re-created the dots, and the dot under the cursor
 * or keyboard focus was replaced — losing focus and swallowing its mouseleave. With it, hover only
 * re-renders the tooltip; the chart itself is untouched.
 */
const Plot = memo(function Plot({
  points,
  axes,
  renderDot,
}: {
  points: RatingPoint[];
  axes: AxisConfig;
  renderDot: (props: ScatterShapeProps) => React.JSX.Element;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" initialDimension={INITIAL_SIZE}>
      <ComposedChart margin={MARGIN} data={points}>
        <CartesianGrid vertical={false} stroke={COLORS.grid} />
        <XAxis
          type="number"
          dataKey="x"
          domain={axes.xDomain}
          ticks={axes.xTicks}
          tickFormatter={(v: number) => String(Math.round(v))}
          stroke="transparent"
          tick={TICK}
          tickMargin={10}
          allowDecimals={false}
        />
        <YAxis
          type="number"
          dataKey="rating"
          domain={axes.yDomain}
          ticks={axes.yTicks}
          stroke="transparent"
          tick={TICK}
          width={44}
          tickMargin={6}
        />
        <Line
          dataKey="trend"
          type="monotone"
          stroke={COLORS.copper}
          strokeWidth={2}
          dot={false}
          activeDot={false}
          isAnimationActive
          animationDuration={1400}
          legendType="none"
        />
        <Scatter dataKey="rating" shape={renderDot} isAnimationActive animationDuration={900} />
      </ComposedChart>
    </ResponsiveContainer>
  );
});

/**
 * Career Ratings: every film is a dot (x = release date, y = TMDB rating, size = number of votes),
 * with a rolling-average line showing the trajectory.
 *
 * Input:  RatingPoint[] from the analytics layer (already filtered to films with enough votes)
 * Output: interactive chart. Hover / keyboard-focus a dot for a poster tooltip; Escape dismisses it.
 *
 * The tooltip is our own HTML rather than Recharts' <Tooltip>: it lets us show a poster image,
 * and gives us keyboard focus support and exact positioning.
 */
export function CareerRatingChart({ points }: { points: RatingPoint[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const axes = useMemo(() => (points.length >= 3 ? buildAxes(points) : null), [points]);
  const maxVotes = useMemo(() => Math.max(...points.map((p) => p.votes), 1), [points]);
  // Area-proportional sizing: radius grows with the square root of votes.
  const radiusFor = useCallback((votes: number) => 4 + 9 * Math.sqrt(votes / maxVotes), [maxVotes]);

  const show = useCallback((point: RatingPoint, cx: number, cy: number) => {
    setHover({ point, cx, cy, width: wrapperRef.current?.clientWidth ?? 0 });
  }, []);

  const renderDot = useCallback(
    (props: ScatterShapeProps) => {
      const { cx, cy } = props;
      const point = props.payload as RatingPoint | undefined;
      if (typeof cx !== "number" || typeof cy !== "number" || !point) return <g />;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radiusFor(point.votes)}
          fill={COLORS.ice}
          fillOpacity={0.55}
          stroke={COLORS.ice}
          strokeWidth={1}
          tabIndex={0}
          role="img"
          aria-label={`${point.title}, ${point.year}, rated ${point.rating.toFixed(1)}`}
          style={{ cursor: "pointer", outline: "none" }}
          onMouseEnter={() => show(point, cx, cy)}
          onMouseLeave={() => setHover(null)}
          onFocus={() => show(point, cx, cy)}
          onBlur={() => setHover(null)}
        />
      );
    },
    [radiusFor, show],
  );

  if (!axes) {
    return (
      <EmptyState
        title="Not enough rated films to chart"
        body="This chart needs at least three films with a meaningful number of TMDB votes."
      />
    );
  }

  // Tooltip placement: above the dot unless there's no room, then below. Clamped inside the chart.
  const radius = hover ? radiusFor(hover.point.votes) : 0;
  const below = hover ? hover.cy < 190 : false;
  const tooltipLeft = hover
    ? Math.min(Math.max(hover.cx, TOOLTIP_W / 2 + 4), Math.max(hover.width - TOOLTIP_W / 2 - 4, TOOLTIP_W / 2 + 4))
    : 0;

  return (
    <figure>
      <div
        ref={wrapperRef}
        className="relative h-[21rem] w-full sm:h-[28rem]"
        // Belt and braces: also clear at the wrapper level (leaving the chart, moving over empty
        // space, or pressing Escape) so the tooltip can never get stuck.
        onMouseLeave={() => setHover(null)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setHover(null);
        }}
        onMouseMove={(event) => {
          if (hover && !(event.target as Element).closest("circle[role=img]")) setHover(null);
        }}
      >
        <Plot points={points} axes={axes} renderDot={renderDot} />

        {hover && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border-2 border-bone bg-ice/25"
              style={{
                left: hover.cx - radius - 2,
                top: hover.cy - radius - 2,
                width: (radius + 2) * 2,
                height: (radius + 2) * 2,
              }}
            />
            <div
              role="tooltip"
              className="pointer-events-none absolute z-20 flex gap-4 rounded-2xl bg-panel/95 p-3 pr-5 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
              style={{
                left: tooltipLeft,
                top: below ? hover.cy + radius + 10 : hover.cy - radius - 10,
                width: TOOLTIP_W,
                transform: `translate(-50%, ${below ? "0" : "-100%"})`,
              }}
            >
              <span className="relative aspect-[2/3] w-[3.25rem] shrink-0 overflow-hidden rounded-lg bg-lift">
                <TmdbImage path={hover.point.posterPath} size="w154" alt="" sizes="52px" kind="poster" />
              </span>
              <span className="min-w-0 self-center">
                <span className="block truncate text-[0.98rem] text-bone">{hover.point.title}</span>
                <span className="mt-0.5 flex items-center gap-2 text-sm text-mist">
                  <span>{hover.point.year}</span>
                  <span aria-hidden="true" className="text-dim">·</span>
                  <span className="flex items-center gap-1 text-ice">
                    <Star className="size-3.5 fill-current" strokeWidth={0} />
                    {hover.point.rating.toFixed(1)}
                  </span>
                </span>
                {hover.point.character && (
                  <span className="mt-1 block truncate text-sm text-dim">as {hover.point.character}</span>
                )}
              </span>
            </div>
          </>
        )}
      </div>

      <figcaption className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-dim">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-ice/60 ring-1 ring-ice" />
          Each film · larger dot = more votes
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="h-0.5 w-5 rounded bg-copper" />
          Rolling average of the last 5 films
        </span>
        <span className="sr-only">
          {points.length} films charted from {axes.minYear} to {axes.maxYear}, ratings between {axes.minRating.toFixed(1)} and{" "}
          {axes.maxRating.toFixed(1)}.
        </span>
      </figcaption>
    </figure>
  );
}
