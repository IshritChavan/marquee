import { CONFIG } from "@/lib/config";

export type ImageSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "w1280"
  | "h632"
  | "original";

/**
 * Build a TMDB image URL from a path like "/abc123.jpg".
 * Returns null when there is no path, so callers can show a fallback.
 * Image URLs are public — no API key is involved.
 */
export function tmdbImage(path: string | null | undefined, size: ImageSize): string | null {
  if (!path) return null;
  return `${CONFIG.tmdb.imageBase}/${size}${path}`;
}

/** Initials for avatar fallbacks: "Christian Bale" → "CB". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}
