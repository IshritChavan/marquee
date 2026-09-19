/**
 * One error type for everything that can go wrong talking to upstream APIs.
 * The `code` lets the UI pick an appropriate message instead of showing a stack trace.
 */

export type AppErrorCode =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CONFIG"
  | "NETWORK"
  | "UPSTREAM"
  | "BAD_REQUEST";

const STATUS: Record<AppErrorCode, number> = {
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  CONFIG: 503,
  NETWORK: 502,
  UPSTREAM: 502,
  BAD_REQUEST: 400,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS[code];
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

/** User-facing copy for each error code. Errors say what happened and what to do. */
export function describeError(code: AppErrorCode): { title: string; body: string } {
  switch (code) {
    case "CONFIG":
      return {
        title: "TMDB API key missing",
        body: "Add TMDB_API_KEY to .env.local, then restart the dev server. The README explains where to get a free key.",
      };
    case "RATE_LIMITED":
      return {
        title: "Too many requests",
        body: "TMDB is rate limiting this app. Wait a few seconds and reload.",
      };
    case "NETWORK":
      return {
        title: "Can't reach TMDB",
        body: "The request timed out or the network is down. Check your connection and reload.",
      };
    case "NOT_FOUND":
      return { title: "Not found", body: "TMDB has no record for that id." };
    case "BAD_REQUEST":
      return { title: "Invalid request", body: "Check the URL and try again." };
    default:
      return {
        title: "TMDB returned an error",
        body: "The data provider had a problem. Reload in a moment.",
      };
  }
}
