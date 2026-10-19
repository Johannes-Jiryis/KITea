import { z } from "zod";
import type { Prisma } from "@prisma/client";

export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  sortBy: z.enum(["newest", "oldest", "highest", "lowest", "most_helpful"]).default("newest"),
  semesterId: z.string().max(128).default("all"),
});
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
export const PAGE_SIZE = 20;
export const reviewOrder = (
  sort: ReviewQuery["sortBy"],
): Prisma.ReviewOrderByWithRelationInput[] => {
  const primary: Prisma.ReviewOrderByWithRelationInput =
    sort === "most_helpful"
      ? { helpfulVotes: { _count: "desc" } }
      : sort === "highest"
        ? { overallRating: "desc" }
        : sort === "lowest"
          ? { overallRating: "asc" }
          : { createdAt: sort === "oldest" ? "asc" : "desc" };
  return [primary, { id: "asc" }];
};
