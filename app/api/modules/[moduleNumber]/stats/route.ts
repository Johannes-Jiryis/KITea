import { getPrisma } from "@/lib/prisma";
import { getModuleStats } from "@/lib/modules/stats";
import { apiError, publicReadGuard } from "@/lib/http/api";
import { HttpError } from "@/lib/http/errors";

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ moduleNumber: string }> },
) => {
  try {
    await publicReadGuard(request);
    const { moduleNumber } = await params;
    const foundModule = await getPrisma().module.findUnique({
      where: { moduleNumber: moduleNumber.toUpperCase() },
      select: { id: true },
    });
    if (!foundModule) throw new HttpError(404, "Module not found.");
    const stats = await getModuleStats(foundModule.id);
    return Response.json({ ...stats, totalReviews: stats.reviewCount });
  } catch (error) {
    return apiError(error, "foundModule.stats");
  }
};
