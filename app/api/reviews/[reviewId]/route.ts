import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { apiError, publicReadGuard, readJson } from "@/lib/http/api";
import { HttpError } from "@/lib/http/errors";
import { removeReview, saveReview } from "@/lib/reviews/service";
import { invalidateReviews } from "@/lib/reviews/invalidate";
import { publicReviewSelect } from "@/lib/reviews/public";

type Context = { params: Promise<{ reviewId: string }> };
export const GET = async (request: Request, { params }: Context) => {
  try {
    await publicReadGuard(request);
    const { reviewId } = await params;
    const review = await getPrisma().review.findUnique({
      where: { id: reviewId },
      select: publicReviewSelect,
    });
    if (!review) throw new HttpError(404, "Review not found.");
    return Response.json(review, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error, "reviews.get");
  }
};

export const PUT = async (request: Request, { params }: Context) => {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new HttpError(401, "Sign in to edit a review.");
    const { reviewId } = await params;
    const result = await saveReview(session.user.id, await readJson(request), reviewId, true);
    invalidateReviews(result.moduleNumbers);
    return Response.json({ id: result.review.id });
  } catch (error) {
    return apiError(error, "reviews.update");
  }
};

export const DELETE = async (request: Request, { params }: Context) => {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new HttpError(401, "Sign in to delete a review.");
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(process.env.NEXTAUTH_URL || request.url).origin)
      throw new HttpError(403, "Request origin is not allowed.");
    const { reviewId } = await params;
    const number = await removeReview(session.user.id, reviewId);
    invalidateReviews([number]);
    return Response.json({ success: true });
  } catch (error) {
    return apiError(error, "reviews.delete");
  }
};
