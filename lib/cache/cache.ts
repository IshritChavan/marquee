/**
 * Tiny cache layer.
 *
 * Why it exists: building an actor profile costs up to ~40 TMDB requests. We never want to
 * do that twice for the same actor (or twice at once — e.g. generateMetadata + the page).
 *
 * How it's structured for growth:
 *   - `CacheStore` is an interface. `MemoryCacheStore` is the only implementation today.
 *     To move to Redis, write `RedisCacheStore implements CacheStore` and change ONE line
 *     (the `store` below). Nothing else in the app knows where the cache lives.
 *   - `cached()` adds request de-duplication: if 5 callers ask for the same key while the
 *     first request is still running, they all share one promise instead of firing 5 requests.
 *
 * Caveat: in serverless (Vercel), each function instance has its own memory. That's fine for an
 * MVP — TMDB responses are ALSO cached by Next's fetch cache (see lib/api/http.ts), which is shared.
 */

export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly maxEntries = 500) {}

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Map iterates in insertion order, so the first key is the oldest. Evict it when full.
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async delete(key: string): Promise<void> {
    this.entries.delete(key);
  }
}

// Keep one store/inflight map across hot reloads in `next dev`.
const globalForCache = globalThis as typeof globalThis & {
  __marqueeStore?: CacheStore;
  __marqueeInflight?: Map<string, Promise<unknown>>;
};

const store: CacheStore = (globalForCache.__marqueeStore ??= new MemoryCacheStore());
const inflight = (globalForCache.__marqueeInflight ??= new Map<string, Promise<unknown>>());

/**
 * Return the cached value for `key`, or run `loader`, cache its result, and return it.
 * Failed loads are NOT cached, so a temporary rate limit doesn't stick for hours.
 */
export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const hit = await store.get<T>(key);
  if (hit !== undefined) return hit;

  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = (async () => {
    try {
      const value = await loader();
      await store.set(key, value, ttlSeconds);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}
