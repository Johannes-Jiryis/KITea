import type { Module, Semester } from "@prisma/client";
import { getPrisma } from "@/lib/prisma";
import { databaseRead } from "@/lib/database/read";
import { cache } from "react";

type ModuleRecord = Module & { semesters: Pick<Semester, "id" | "name" | "year">[] };

export const getModuleByNumber = cache(async (identifier: string) => {
  // Resolve aliases and semester options in one round trip to the remote database.
  const rows = await databaseRead(
    () => getPrisma().$queryRaw<ModuleRecord[]>`
    SELECT parent.id, parent."moduleNumber", parent."moduleName", parent.description,
      parent."createdAt", parent."canonicalModuleId",
      coalesce(terms.semesters, '[]'::jsonb) AS semesters
    FROM "Module" source
    JOIN "Module" parent ON parent.id = coalesce(source."canonicalModuleId", source.id)
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'year', s.year)
        ORDER BY s.year DESC, s.name ASC, s.id ASC) AS semesters
      FROM "_ModuleToSemester" link JOIN "Semester" s ON s.id = link."B"
      WHERE link."A" = parent.id
    ) terms ON true
    WHERE source."moduleNumber" = ${identifier.toUpperCase()} OR source.id = ${identifier}
    ORDER BY (source."moduleNumber" = ${identifier.toUpperCase()}) DESC, source.id ASC
    LIMIT 1`,
  );
  return rows[0] ?? null;
});
