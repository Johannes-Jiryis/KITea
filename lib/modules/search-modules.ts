import { getPrisma } from "@/lib/prisma";
import { buildSearchQuery } from "@/lib/search/query";
import { normalizeSearchQuery } from "@/lib/search/normalize";
import type { ModuleSearchResult } from "@/lib/search/types";
import { databaseRead } from "@/lib/database/read";

export const searchModules = async (query: string): Promise<ModuleSearchResult[]> => {
  const normalized = normalizeSearchQuery(query);
  if (normalized.length < 2) return [];
  return databaseRead(() =>
    getPrisma().$queryRaw<ModuleSearchResult[]>(buildSearchQuery(normalized)),
  );
};
