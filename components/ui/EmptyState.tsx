import { Info } from "lucide-react";

/** Used whenever data is missing. Says what's missing and (where possible) why. */
export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-3xl bg-panel/50 px-7 py-10 sm:flex-row sm:items-center sm:gap-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-mist">
        <Info className="size-5" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-bone">{title}</p>
        {body && <p className="mt-1 max-w-xl text-sm leading-relaxed text-dim">{body}</p>}
      </div>
    </div>
  );
}
