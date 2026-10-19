import { getPrisma } from "@/lib/prisma";
import { apiError, publicReadGuard } from "@/lib/http/api";

export const GET = async (request: Request) => {
  try {
    await publicReadGuard(request);
    const review = await getPrisma().review.findFirst({ select: { id: true } });
    return Response.json({ hasReviews: !!review });
  } catch (error) {
    return apiError(error, "reviews.exists");
  }
};
