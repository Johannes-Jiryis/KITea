"use server";

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http/errors";
import { lockUser, consumeWriteBudget } from "@/lib/reviews/service";
import { invalidateReviews } from "@/lib/reviews/invalidate";

type HelpfulResult =
  | { success: true; helpfulCount: number; userHasVoted: boolean }
  | { success: false; error: string };

export const toggleReviewHelpful = async (
  reviewId: string,
  moduleId: string,
): Promise<HelpfulResult> => {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Sign in to mark reviews as helpful." };
    const userId = session.user.id;
    await consumeWriteBudget(userId);
    const result = await getPrisma().$transaction(async (tx) => {
      await lockUser(tx, userId);
      // Serialize votes for a review, including counts and concurrent toggles.
      await tx.$queryRaw`SELECT id FROM "Review" WHERE id = ${reviewId} FOR UPDATE`;
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        include: { module: { select: { moduleNumber: true } } },
      });
      if (!review || review.moduleId !== moduleId) throw new HttpError(404, "Review not found.");
      if (review.userId === userId) throw new HttpError(403, "You cannot vote on your own review.");
      const existing = await tx.reviewHelpful.findUnique({
        where: { reviewId_userId: { reviewId, userId } },
      });
      if (existing) await tx.reviewHelpful.delete({ where: { id: existing.id } });
      else await tx.reviewHelpful.create({ data: { reviewId, userId } });
      const helpfulCount = await tx.reviewHelpful.count({ where: { reviewId } });
      return { moduleNumber: review.module.moduleNumber, helpfulCount, userHasVoted: !existing };
    });
    invalidateReviews([result.moduleNumber]);
    return { success: true, helpfulCount: result.helpfulCount, userHasVoted: result.userHasVoted };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof HttpError ? error.message : "Could not update vote. Please try again.",
    };
  }
};
