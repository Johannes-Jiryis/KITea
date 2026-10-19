import { getPrisma } from "@/lib/prisma";
import { apiError, publicReadGuard } from "@/lib/http/api";

export const GET = async (request: Request) => {
  try {
    await publicReadGuard(request);
    const modules = await getPrisma().module.findMany({
      select: { moduleNumber: true, moduleName: true },
      orderBy: [{ reviews: { _count: "desc" } }, { moduleNumber: "asc" }],
      take: 6,
    });
    return Response.json({ modules }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error, "modules.popular");
  }
};
