import { NextResponse } from "next/server";
import { AppError, describeError, isAppError } from "./errors";

/** Convert any thrown value into a consistent JSON error response. Never leaks internals. */
export function errorResponse(err: unknown): NextResponse {
  if (isAppError(err)) {
    return NextResponse.json(
      { error: { code: err.code, message: describeError(err.code).body } },
      { status: err.status },
    );
  }
  console.error("Unexpected API error:", err instanceof Error ? err.message : err);
  const fallback = new AppError("UPSTREAM", "Unexpected error");
  return NextResponse.json(
    { error: { code: fallback.code, message: "Something went wrong. Try again in a moment." } },
    { status: 500 },
  );
}

/** Parse a positive integer id from a URL segment. Returns null for anything else. */
export function parseId(raw: string): number | null {
  return /^\d{1,9}$/.test(raw) && Number(raw) > 0 ? Number(raw) : null;
}
