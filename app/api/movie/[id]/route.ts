/**
 * GET /api/movie/:id
 * Output: MovieExtras (runtime, budget, revenue, director, IMDb / RT / Metascore)
 * Why:    called lazily when the user opens a movie modal, so we never pay for extras up front.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getMovieExtras } from "@/lib/services/movieService";
import { AppError } from "@/lib/utils/errors";
import { errorResponse, parseId } from "@/lib/utils/apiResponse";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id === null) return errorResponse(new AppError("BAD_REQUEST", "Invalid movie id"));

  try {
    const extras = await getMovieExtras(id);
    return NextResponse.json(extras, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
