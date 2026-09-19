/**
 * Colours needed in JS (Recharts takes colour strings, not CSS classes).
 * Keep in sync with the @theme block in app/globals.css.
 */
export const COLORS = {
  canvas: "#121316",
  panel: "#1a1c21",
  lift: "#23262d",
  bone: "#ece7dc",
  mist: "#a6a398",
  dim: "#83868e",
  gilt: "#d4a85a",
  ice: "#8ec5d6",
  copper: "#c98b6b",
  grid: "rgba(236, 231, 220, 0.07)",
} as const;

/** Categorical palette for the genre donut. "Other" always uses `stone`. */
export const GENRE_COLORS = ["#8ec5d6", "#c98b6b", "#9cb88f", "#7b8db8", "#c98aa0", "#b9a26c"] as const;
export const OTHER_COLOR = "#6f7480";
