import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { describeError, type AppErrorCode } from "@/lib/utils/errors";

/** Shown when a profile can't be built (rate limit, network, missing key …). Says what happened and what to do. */
export function ActorError({ code }: { code: AppErrorCode }) {
  const { title, body } = describeError(code);
  return (
    <div className="mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <TriangleAlert className="size-8 text-copper" strokeWidth={1.25} />
      <h1 className="mt-6 font-display text-4xl text-bone">{title}</h1>
      <p className="mt-4 leading-relaxed text-mist">{body}</p>
      <Link href="/" className="mt-8 rounded-full bg-white/[0.08] px-6 py-3 text-bone transition-colors hover:bg-white/[0.14]">
        Back to search
      </Link>
    </div>
  );
}
