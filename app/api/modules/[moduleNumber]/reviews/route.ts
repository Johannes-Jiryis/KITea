import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { apiError, publicReadGuard, readJson } from "@/lib/http/api";
import { HttpError } from "@/lib/http/errors";
import { getModuleReviews } from "@/lib/modules/reviews";
import { reviewQuerySchema } from "@/lib/modules/review-query";
import { saveReview } from "@/lib/reviews/service";
import { invalidateReviews } from "@/lib/reviews/invalidate";

type Context = { params: Promise<{ moduleNumber: string }> };
export const GET = async (request: Request, { params }: Context) => {
  try {
    await publicReadGuard(request);
    const { moduleNumber } = await params;
    const foundModule = await getPrisma().module.findUnique({
      where: { moduleNumber: moduleNumber.toUpperCase() },
      select: { id: true },
    });
    if (!foundModule) throw new HttpError(404, "Module not found.");
    const query = reviewQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const session = await auth();
    return Response.json(await getModuleReviews(foundModule.id, query, session?.user?.id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiError(error, "foundModule.reviews.get");
  }
};

export const POST = async (request: Request, { params }: Context) => {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new HttpError(401, "Sign in to write a review.");
    const body = await readJson(request);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new HttpError(400, "Expected an object.");
    const { moduleNumber } = await params;
    const foundModule = await getPrisma().module.findUnique({
      where: { moduleNumber: moduleNumber.toUpperCase() },
      select: { id: true },
    });
    if (!foundModule) throw new HttpError(404, "Module not found.");
    const result = await saveReview(session.user.id, { ...body, moduleId: foundModule.id });
    invalidateReviews(result.moduleNumbers);
    return Response.json({ id: result.review.id }, { status: 201 });
  } catch (error) {
    return apiError(error, "foundModule.reviews.create");
  }
};
