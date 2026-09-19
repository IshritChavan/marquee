import { KeyRound } from "lucide-react";
import { connection } from "next/server";

/**
 * Friendly first-run helper: if TMDB_API_KEY isn't set, tell the developer exactly what to do
 * instead of showing an empty page. Renders nothing once the key exists.
 */
export async function SetupNotice() {
  await connection();
  if (process.env.TMDB_API_KEY?.trim()) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
      <div className="flex items-start gap-5 rounded-3xl bg-panel/70 px-7 py-7">
        <KeyRound className="mt-1 size-5 shrink-0 text-copper" strokeWidth={1.5} />
        <div>
          <p className="text-bone">TMDB API key not found</p>
          <p className="mt-1 text-sm leading-relaxed text-mist">
            Copy <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em]">.env.local.example</code> to{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em]">.env.local</code>, paste your key after{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em]">TMDB_API_KEY=</code>, then restart{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em]">npm run dev</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
