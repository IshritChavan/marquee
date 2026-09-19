/**
 * GET /api/search?q=chris
 * Input:  query string `q`
 * Output: { results: ActorSearchResult[] }   (or { error: { code, message } })
 * Why:    keeps the TMDB key on the server and gives the browser a clean, normalized shape.
 */
import { NextResponse, type NextRequest } from "next/server";
import { searchActors } from "@/lib/services/searchService";
import { errorResponse } from "@/lib/utils/apiResponse";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = await searchActors(q);
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
