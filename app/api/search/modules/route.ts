import { NextRequest } from "next/server";
import { searchModules } from "@/lib/modules/search-modules";
import { apiError, publicReadGuard } from "@/lib/http/api";

export const GET = async (request: NextRequest) => {
  try {
    await publicReadGuard(request);
    const results = await searchModules(request.nextUrl.searchParams.get("q") ?? "");
    return Response.json({ results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error, "search.modules");
  }
};
