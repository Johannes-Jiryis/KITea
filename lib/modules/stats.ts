import { getPrisma } from "@/lib/prisma";

type StatsRow = {
  reviewCount: number;
  averageRating: number | null;
  averageDifficulty: number | null;
  averageWorkload: number | null;
  buckets: { rating: number; count: number }[];
};

export const getModuleStats = async (moduleId: string) => {
  // One statement gives counts, averages, and the histogram the same snapshot,
  // without a multi-statement read transaction and its network round trips.
  const [totals] = await getPrisma().$queryRaw<StatsRow[]>`
    WITH buckets AS (
      SELECT "overallRating"::float8 AS rating, count(*)::int AS count,
        sum("difficultyRating")::float8 AS difficulty,
        sum("workloadRating")::float8 AS workload
      FROM "Review" WHERE "moduleId" = ${moduleId}
      GROUP BY "overallRating"
    )
    SELECT coalesce(sum(count), 0)::int AS "reviewCount",
      (sum(rating * count) / nullif(sum(count), 0))::float8 AS "averageRating",
      (sum(difficulty) / nullif(sum(count), 0))::float8 AS "averageDifficulty",
      (sum(workload) / nullif(sum(count), 0))::float8 AS "averageWorkload",
      coalesce(jsonb_agg(jsonb_build_object('rating', rating, 'count', count)), '[]'::jsonb) AS buckets
    FROM buckets
  `;
  const average = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);
  return {
    reviewCount: totals.reviewCount,
    averageRating: average(totals.averageRating),
    averageDifficulty: average(totals.averageDifficulty),
    averageWorkload: average(totals.averageWorkload),
    ratingDistribution: Array.from({ length: 10 }, (_, index) => {
      const rating = ((index + 1) / 2).toFixed(1);
      return {
        rating,
        count: totals.buckets.find((bucket) => bucket.rating.toFixed(1) === rating)?.count ?? 0,
      };
    }),
  };
};
