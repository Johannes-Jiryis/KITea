import { cache } from "react";
import { semesterLabel } from "@/lib/reviews/serialize";
import { getModuleReviews } from "@/lib/modules/reviews";
import { getModuleStats } from "@/lib/modules/stats";
import { reviewQuerySchema, type ReviewQuery } from "@/lib/modules/review-query";
import type { ModulePageData } from "@/lib/modules/types";
import { databaseRead } from "@/lib/database/read";
import { getModuleByNumber } from "@/lib/modules/get-module";

export const getModulePageData = cache(
  async (
    identifier: string,
    currentUserId?: string | null,
    query: ReviewQuery = reviewQuerySchema.parse({}),
  ): Promise<ModulePageData | null> => {
    const foundModule = await getModuleByNumber(identifier);
    if (!foundModule) return null;
    const [stats, page] = await Promise.all([
      databaseRead(() => getModuleStats(foundModule.id)),
      databaseRead(() => getModuleReviews(foundModule.id, query, currentUserId)),
    ]);
    return {
      id: foundModule.id,
      moduleNumber: foundModule.moduleNumber,
      moduleName: foundModule.moduleName,
      description: foundModule.description,
      semesters: foundModule.semesters.map((s) => ({
        id: s.id,
        label: semesterLabel(s.name, s.year),
      })),
      stats,
      reviews: page.reviews,
      reviewPage: { ...query, total: page.total, pageSize: page.pageSize },
    };
  },
);
