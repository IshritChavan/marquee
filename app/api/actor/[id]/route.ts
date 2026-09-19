/**
 * GET /api/actor/:id
 * Output: the full ActorProfile as JSON — the same data the actor page renders.
 * Why:    handy for debugging, and it's the seam a future mobile app / comparison feature can use.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getActorProfile } from "@/lib/services/actorService";
import { AppError } from "@/lib/utils/errors";
import { errorResponse, parseId } from "@/lib/utils/apiResponse";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) return errorResponse(new AppError("BAD_REQUEST", "Invalid actor id"));

  try {
    const profile = await getActorProfile(id);
    return NextResponse.json(profile, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=21600" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
