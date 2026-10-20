import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http/errors";
import { reviewFormSchema, reviewPatchSchema } from "@/lib/reviews/schema";
import { toReviewFormValues } from "@/lib/reviews/serialize";

export const lockUser = async (tx: Prisma.TransactionClient, userId: string) => {
  const rows = await tx.$queryRaw<
    { id: string }[]
  >`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
  if (!rows.length) throw new HttpError(401, "Sign in again to continue.");
};

export const consumeWriteBudget = async (userId: string) => {
  const key = `write:${userId}`;
  const budget = await getPrisma().$queryRaw<{ count: number }[]>`
    INSERT INTO "RequestLimit" (key, count, "expiresAt")
    VALUES (${key}, 1, date_trunc('minute', now()) + interval '1 minute')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RequestLimit"."expiresAt" <= now() THEN 1 ELSE "RequestLimit".count + 1 END,
      "expiresAt" = date_trunc('minute', now()) + interval '1 minute'
    RETURNING count`;
  if (budget[0].count > 60) throw new HttpError(429, "Too many changes. Please wait a minute.", 60);
};

const validateReferences = async (
  tx: Prisma.TransactionClient,
  moduleId: string,
  semesterId: string,
) => {
  const foundModule = await tx.module.findUnique({
    where: { id: moduleId },
    include: { canonicalModule: true },
  });
  const semester = await tx.semester.findUnique({
    where: { id: semesterId },
    select: { id: true },
  });
  if (!foundModule || !semester) throw new HttpError(404, "Module or semester not found.");
  return foundModule.canonicalModule ?? foundModule;
};

export const saveReview = async (
  userId: string,
  input: unknown,
  reviewId?: string,
  partial = false,
) => {
  await consumeWriteBudget(userId);
  return getPrisma().$transaction(async (tx) => {
    await lockUser(tx, userId);
    const existing = reviewId
      ? await tx.review.findUnique({
          where: { id: reviewId },
          include: { module: { select: { moduleNumber: true } } },
        })
      : null;
    if (reviewId && !existing) throw new HttpError(404, "Review not found.");
    if (existing && existing.userId !== userId)
      throw new HttpError(403, "You cannot change this review.");
    const candidate =
      partial && existing
        ? { ...toReviewFormValues(existing), ...reviewPatchSchema.parse(input) }
        : input;
    const values = reviewFormSchema.parse(candidate);
    const targetModule = await validateReferences(tx, values.moduleId, values.semesterTakenId);
    values.moduleId = targetModule.id;
    const moduleNumber = targetModule.moduleNumber;
    if (!existing) {
      const count = await tx.reviewSubmission.count({
        where: { userId, createdAt: { gte: new Date(Date.now() - 86_400_000) } },
      });
      const last = await tx.reviewSubmission.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (count >= 10)
        throw new HttpError(429, "You can submit up to 10 reviews in 24 hours.", 3600);
      if (last && Date.now() - last.createdAt.getTime() < 60_000)
        throw new HttpError(429, "Please wait 60 seconds between reviews.", 60);
      await tx.reviewSubmission.create({ data: { userId } });
    }
    // Explicit nulls allow clearing optional fields during edits.
    const data = {
      ...values,
      lecturerName: values.lecturerName ?? null,
      lecturerReview: values.lecturerReview ?? null,
      taName: values.taName ?? null,
      taReview: values.taReview ?? null,
      homeworkReview: values.homeworkReview ?? null,
      examReview: values.examReview ?? null,
    };
    const review = existing
      ? await tx.review.update({ where: { id: existing.id }, data })
      : await tx.review.create({ data: { ...data, userId } });
    return {
      review,
      moduleNumbers: [
        ...new Set([moduleNumber, existing?.module.moduleNumber].filter((v): v is string => !!v)),
      ],
    };
  });
};

export const removeReview = async (userId: string, reviewId: string) => {
  await consumeWriteBudget(userId);
  return getPrisma().$transaction(async (tx) => {
    await lockUser(tx, userId);
    const existing = await tx.review.findUnique({
      where: { id: reviewId },
      include: { module: { select: { moduleNumber: true } } },
    });
    if (!existing) throw new HttpError(404, "Review not found.");
    if (existing.userId !== userId) throw new HttpError(403, "You cannot delete this review.");
    await tx.review.delete({ where: { id: reviewId } });
    return existing.module.moduleNumber;
  });
};
