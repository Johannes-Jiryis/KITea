import { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { semesterLabel } from "@/lib/reviews/serialize";
import { PAGE_SIZE, type ReviewQuery } from "@/lib/modules/review-query";
import type { ModuleReviewItem } from "@/lib/modules/types";

type ReviewRow = Omit<ModuleReviewItem, "id" | "createdAt" | "semesterLabel"> & {
  id: string | null;
  createdAt: Date;
  semesterName: string;
  semesterYear: number;
  total: number;
};
const sqlOrder: Record<ReviewQuery["sortBy"], Prisma.Sql> = {
  newest: Prisma.sql`r."createdAt" DESC`,
  oldest: Prisma.sql`r."createdAt" ASC`,
  highest: Prisma.sql`r."overallRating" DESC`,
  lowest: Prisma.sql`r."overallRating" ASC`,
  most_helpful: Prisma.sql`(SELECT count(*) FROM "ReviewHelpful" h WHERE h."reviewId" = r.id) DESC`,
};

export const getModuleReviews = async (
  moduleId: string,
  query: ReviewQuery,
  userId?: string | null,
) => {
  const filter = Prisma.sql`r."moduleId" = ${moduleId} ${query.semesterId === "all" ? Prisma.empty : Prisma.sql`AND r."semesterTakenId" = ${query.semesterId}`}`;
  const order = sqlOrder[query.sortBy];
  // One statement preserves the total/page snapshot. Count separately from the
  // bounded page so an empty or out-of-range page still returns the real total.
  const rows = await getPrisma().$queryRaw<ReviewRow[]>(Prisma.sql`
    WITH total AS (
      SELECT count(*)::int AS total FROM "Review" r WHERE ${filter}
    ), page AS (
      SELECT r.* FROM "Review" r WHERE ${filter}
      ORDER BY ${order}, r.id ASC
      LIMIT ${PAGE_SIZE} OFFSET ${(query.page - 1) * PAGE_SIZE}
    )
    SELECT total.total, r.id,
      (r."userId" = ${userId ?? ""}) AS "isOwnReview",
      r."semesterTakenId" AS "semesterId", s.name AS "semesterName", s.year AS "semesterYear",
      r."overallRating"::float8 AS "overallRating",
      r."difficultyRating"::float8 AS "difficultyRating",
      r."workloadRating"::float8 AS "workloadRating",
      r.summary, r."lecturerName", r."lecturerReview", r."taName", r."taReview",
      r."homeworkReview", r."examReview", r."createdAt",
      votes.count AS "helpfulCount",
      EXISTS (SELECT 1 FROM "ReviewHelpful" v WHERE v."reviewId" = r.id AND v."userId" = ${userId ?? ""}) AS "userHasVoted"
    FROM total
    LEFT JOIN page r ON true
    LEFT JOIN "Semester" s ON s.id = r."semesterTakenId"
    LEFT JOIN LATERAL (SELECT count(*)::int AS count FROM "ReviewHelpful" v WHERE v."reviewId" = r.id) votes ON true
    ORDER BY ${order}, r.id ASC
  `);
  const reviews: ModuleReviewItem[] = rows.flatMap((review) =>
    review.id === null
      ? []
      : [
          {
            id: review.id,
            isOwnReview: review.isOwnReview,
            semesterId: review.semesterId,
            semesterLabel: semesterLabel(review.semesterName, review.semesterYear),
            overallRating: review.overallRating,
            difficultyRating: review.difficultyRating,
            workloadRating: review.workloadRating,
            summary: review.summary,
            lecturerName: review.lecturerName,
            lecturerReview: review.lecturerReview,
            taName: review.taName,
            taReview: review.taReview,
            homeworkReview: review.homeworkReview,
            examReview: review.examReview,
            createdAt: review.createdAt.toISOString(),
            helpfulCount: review.helpfulCount,
            userHasVoted: review.userHasVoted,
          },
        ],
  );
  return { reviews, total: rows[0].total, page: query.page, pageSize: PAGE_SIZE };
};
