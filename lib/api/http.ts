/**
 * fetchJson — the single place where we call `fetch` for upstream APIs.
 *
 * Input:  a URL + how long Next.js may cache the response (`revalidate`, seconds).
 * Output: parsed JSON, or a typed AppError (never a raw stack trace / never leaks the API key).
 *
 * Handles: timeouts, network failures, 401 (bad key), 404, one retry on 429 (rate limit).
 */
import { sleep } from "@/lib/utils/async";
import { AppError } from "@/lib/utils/errors";

interface FetchJsonOptions {
  /** Seconds Next.js's data cache may reuse this response. */
  revalidate: number;
  /** Short name used in error messages. Never put a URL here — URLs can contain API keys. */
  label: string;
  headers?: HeadersInit;
}

const TIMEOUT_MS = 10_000;

export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Accept: "application/json", ...options.headers },
        next: { revalidate: options.revalidate },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new AppError("NETWORK", `${options.label}: request failed or timed out`);
    }

    if (response.status === 429) {
      if (attempt === 0) {
        // Respect Retry-After when it's short; otherwise wait a moment and try once more.
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 800, 2000));
        continue;
      }
      throw new AppError("RATE_LIMITED", `${options.label}: rate limited`);
    }

    if (response.ok) {
      try {
        return (await response.json()) as T;
      } catch {
        throw new AppError("UPSTREAM", `${options.label}: response was not valid JSON`);
      }
    }

    if (response.status === 401 || response.status === 403) {
      throw new AppError("CONFIG", `${options.label}: API key was rejected`);
    }
    if (response.status === 404) {
      throw new AppError("NOT_FOUND", `${options.label}: not found`);
    }
    throw new AppError("UPSTREAM", `${options.label}: HTTP ${response.status}`);
  }

  throw new AppError("RATE_LIMITED", `${options.label}: rate limited`);
}
