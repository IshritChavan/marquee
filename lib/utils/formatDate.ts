/**
 * Date helpers. TMDB dates are plain "YYYY-MM-DD" strings. Parsing them with
 * `new Date("1974-01-30")` gives UTC midnight, which can display as Jan 29 in US time zones.
 * So we build the date in UTC and format in UTC — the calendar day never shifts.
 */

function parseIso(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
}

export function parseYear(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));
  return Number.isInteger(year) && year > 1800 ? year : null;
}

/** "January 30, 1974" */
export function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const date = parseIso(iso);
  if (!date) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Age in whole years today (or at the death date when given). */
export function ageFrom(birthday: string | null, deathday: string | null, now: Date = new Date()): number | null {
  if (!birthday) return null;
  const born = parseIso(birthday);
  if (!born) return null;
  const end = (deathday ? parseIso(deathday) : null) ?? now;
  let age = end.getUTCFullYear() - born.getUTCFullYear();
  const hadBirthday =
    end.getUTCMonth() > born.getUTCMonth() ||
    (end.getUTCMonth() === born.getUTCMonth() && end.getUTCDate() >= born.getUTCDate());
  if (!hadBirthday) age -= 1;
  return age >= 0 ? age : null;
}

/** "1986 – Present" / "1994 – 2011" / "2004" */
export function formatYearRange(start: number | null, end: number | null, isActive: boolean): string {
  if (start === null) return "Unknown";
  if (isActive) return `${start} – Present`;
  if (end === null || end === start) return String(start);
  return `${start} – ${end}`;
}

/** 152 → "2h 32m" */
export function formatRuntime(minutes: number | null | undefined): string | null {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** True when the date is after `now` (film not released yet). */
export function isFuture(iso: string | null | undefined, now: Date = new Date()): boolean {
  if (!iso) return false;
  const date = parseIso(iso);
  return date !== null && date.getTime() > now.getTime();
}
