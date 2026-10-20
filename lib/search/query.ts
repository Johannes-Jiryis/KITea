import { Prisma } from "@prisma/client";

export const escapeLike = (query: string) => query.replace(/[\\%_]/g, "\\$&");

export const buildSearchQuery = (query: string) => {
  const escaped = escapeLike(query);
  const prefix = `${escaped}%`;
  const contains = `%${escaped}%`;
  return Prisma.sql`
    WITH literal_matches AS MATERIALIZED (
      SELECT id, "moduleNumber", "moduleName",
        CASE
          WHEN lower("moduleNumber") = lower(${query}) THEN 0
          WHEN "moduleNumber" ILIKE ${prefix} ESCAPE '\\' THEN 1
          WHEN "moduleName" ILIKE ${prefix} ESCAPE '\\' THEN 2
          WHEN "searchVector" @@ plainto_tsquery('simple', ${query}) THEN 3
          ELSE 4 END AS rank,
        0::real AS score
      FROM "Module"
      WHERE "moduleNumber" ILIKE ${contains} ESCAPE '\\'
        OR "moduleName" ILIKE ${contains} ESCAPE '\\'
        OR "searchVector" @@ plainto_tsquery('simple', ${query})
    ), fuzzy_matches AS (
      SELECT m.id, m."moduleNumber", m."moduleName", 5 AS rank,
        greatest(similarity(m."moduleName", ${query}), similarity(m."moduleNumber", ${query})) AS score
      FROM "Module" m
      WHERE ${query.length >= 3} AND (
          SELECT count(DISTINCT coalesce(source."canonicalModuleId", source.id))
          FROM literal_matches l JOIN "Module" source ON source.id = l.id
        ) < 10
        AND (m."moduleName" % ${query} OR m."moduleNumber" % ${query})
        AND NOT EXISTS (SELECT 1 FROM literal_matches l WHERE l.id = m.id)
    ), resolved AS (
      SELECT parent.id, parent."moduleNumber", parent."moduleName", matches.rank, matches.score,
        row_number() OVER (
          PARTITION BY parent.id ORDER BY matches.rank ASC, matches.score DESC, matches.id ASC
        ) AS position
      FROM (SELECT * FROM literal_matches UNION ALL SELECT * FROM fuzzy_matches) matches
      JOIN "Module" source ON source.id = matches.id
      JOIN "Module" parent ON parent.id = coalesce(source."canonicalModuleId", source.id)
    )
    SELECT id, "moduleNumber", "moduleName"
    FROM resolved WHERE position = 1
    ORDER BY rank ASC, score DESC, "moduleNumber" ASC, id ASC
    LIMIT 10`;
};
