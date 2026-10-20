"use server";

import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http/errors";
import { saveReview, removeReview } from "@/lib/reviews/service";
import { invalidateReviews } from "@/lib/reviews/invalidate";
import { apiError } from "@/lib/http/api";
import { getModuleByNumber } from "@/lib/modules/get-module";
import { semesterLabel, toReviewFormValues, type ReviewListItem } from "@/lib/reviews/serialize";
import type { ReviewFormValues } from "@/lib/reviews/schema";

export type ReviewFormOption = { id: string; label: string };
export type ReviewFormOptions = { modules: ReviewFormOption[]; semesters: ReviewFormOption[] };
type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

export const getReviewFormOptions = async (moduleId?: string): Promise<ReviewFormOptions> => {
  if (!(await auth())?.user?.id) return { modules: [], semesters: [] };
  const prisma = getPrisma();
  const [modules, semesters] = await Promise.all([
    moduleId ? getModuleByNumber(moduleId).then((module) => (module ? [module] : [])) : [],
    prisma.semester.findMany({ take: 100, orderBy: [{ year: "desc" }, { name: "asc" }] }),
  ]);
  return {
    modules: modules.map((m) => ({ id: m.id, label: `${m.moduleNumber} — ${m.moduleName}` })),
    semesters: semesters.map((s) => ({ id: s.id, label: semesterLabel(s.name, s.year) })),
  };
};

export const getMyReviews = async (page = 1): Promise<ReviewListItem[]> => {
  const userId = (await auth())?.user?.id;
  if (!userId) return [];
  const safePage = Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1;
  const reviews = await getPrisma().review.findMany({
    where: { userId },
    take: 21,
    skip: (safePage - 1) * 20,
    include: {
      module: { select: { moduleNumber: true, moduleName: true } },
      semesterTaken: { select: { name: true, year: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
  });
  return reviews.map((review) => ({
    id: review.id,
    moduleId: review.moduleId,
    moduleNumber: review.module.moduleNumber,
    moduleName: review.module.moduleName,
    semesterLabel: semesterLabel(review.semesterTaken.name, review.semesterTaken.year),
    overallRating: Number(review.overallRating),
    summary: review.summary,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  }));
};

export const getReviewForEdit = async (reviewId: string) => {
  const userId = (await auth())?.user?.id;
  if (!userId) return null;
  const review = await getPrisma().review.findFirst({
    where: { id: reviewId, userId },
    include: { module: { select: { moduleNumber: true, moduleName: true } } },
  });
  if (!review) return null;
  return {
    review: toReviewFormValues(review),
    moduleLabel: `${review.module.moduleNumber} — ${review.module.moduleName}`,
  };
};

const actionFailure = async (error: unknown): Promise<{ success: false; error: string }> => {
  const response = apiError(error, "review.action");
  const body = (await response.json()) as { error: string };
  return { success: false, error: body.error };
};

const writeReview = async (
  input: ReviewFormValues,
  reviewId?: string,
): Promise<ActionResult<{ id: string }>> => {
  try {
    const userId = (await auth())?.user?.id;
    if (!userId) throw new HttpError(401, "Sign in to write a review.");
    const result = await saveReview(userId, input, reviewId);
    invalidateReviews(result.moduleNumbers);
    return { success: true, data: { id: result.review.id } };
  } catch (error) {
    return actionFailure(error);
  }
};
export const createReview = async (input: ReviewFormValues) => writeReview(input);
export const updateReview = async (reviewId: string, input: ReviewFormValues) =>
  writeReview(input, reviewId);

export const deleteReview = async (reviewId: string): Promise<ActionResult> => {
  try {
    const userId = (await auth())?.user?.id;
    if (!userId) throw new HttpError(401, "Sign in to delete a review.");
    invalidateReviews([await removeReview(userId, reviewId)]);
    return { success: true };
  } catch (error) {
    return actionFailure(error);
  }
};
