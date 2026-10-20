import { Prisma, type PrismaClient } from "@prisma/client";
import { matchingParents, type HandbookLink } from "./handbook-links";

export const consolidateCatalog = async (
  prisma: PrismaClient,
  links: HandbookLink[],
  options: {
    apply: boolean;
    backup?: (records: unknown) => Promise<void>;
    approvedPairs?: { courseNumber: string; moduleNumber: string }[];
  },
) =>
  prisma.$transaction(
    async (tx) => {
      if (options.apply) {
        if (!options.backup)
          throw new Error("A backup writer is required before applying changes.");
        // Block concurrent review writes/imports while checking uniqueness and transferring references.
        await tx.$executeRaw`LOCK TABLE "Module", "Review", "ReviewHelpful", "_ModuleToSemester" IN SHARE ROW EXCLUSIVE MODE`;
      }
      const numbers = [
        ...new Set(links.flatMap((link) => [link.courseNumber, ...link.moduleNumbers])),
      ];
      const modules = await tx.module.findMany({
        where: { moduleNumber: { in: numbers } },
        include: { semesters: true, reviews: { include: { helpfulVotes: true } } },
      });
      const byNumber = new Map(modules.map((module) => [module.moduleNumber, module]));
      const groups = new Map<string, typeof modules>();
      const ambiguous: string[] = [];
      const missing: string[] = [];
      const unmatched: string[] = [];
      const outsideApproval: string[] = [];
      for (const link of links) {
        const source = byNumber.get(link.courseNumber);
        if (!source) continue;
        const parents = matchingParents(link, source.moduleName, source.semesters);
        if (!parents.length) {
          unmatched.push(link.courseNumber);
          continue;
        }
        if (parents.length !== 1) {
          ambiguous.push(link.courseNumber);
          continue;
        }
        if (
          options.approvedPairs &&
          !options.approvedPairs.some(
            (pair) => pair.courseNumber === link.courseNumber && pair.moduleNumber === parents[0],
          )
        ) {
          outsideApproval.push(link.courseNumber);
          continue;
        }
        const target = byNumber.get(parents[0]);
        if (!target) {
          missing.push(link.courseNumber);
          continue;
        }
        if (
          target.canonicalModuleId ||
          source.id === target.id ||
          (source.canonicalModuleId && source.canonicalModuleId !== target.id)
        )
          throw new Error(`Conflicting canonical mapping for ${source.moduleNumber}`);
        const group = groups.get(target.id) ?? [target];
        if (!group.some((row) => row.id === source.id)) group.push(source);
        groups.set(target.id, group);
      }
      const conflicts: string[] = [];
      const pairs: {
        sourceId: string;
        targetId: string;
        courseNumber: string;
        moduleNumber: string;
      }[] = [];
      let movedReviews = 0;
      for (const [targetId, group] of groups) {
        const keys = group.flatMap((row) =>
          row.reviews.map((review) => `${review.userId}:${review.semesterTakenId}`),
        );
        if (new Set(keys).size !== keys.length) {
          conflicts.push(group[0].moduleNumber);
          continue;
        }
        for (const source of group.slice(1)) {
          if (source.canonicalModuleId === targetId) continue;
          pairs.push({
            sourceId: source.id,
            targetId,
            courseNumber: source.moduleNumber,
            moduleNumber: group[0].moduleNumber,
          });
          movedReviews += source.reviews.length;
        }
      }
      const report = {
        apply: options.apply,
        aliases: pairs.length,
        movedReviews,
        conflicts,
        ambiguous,
        missing,
        unmatched,
        outsideApproval,
        pairs,
      };
      if (!options.apply || !pairs.length) return report;
      await options.backup!({ capturedAt: new Date().toISOString(), modules, report });
      const beforeReviews = await tx.review.count();
      const beforeVotes = await tx.reviewHelpful.count();
      const values = Prisma.join(
        pairs.map((pair) => Prisma.sql`(${pair.sourceId}::text, ${pair.targetId}::text)`),
      );
      await tx.$executeRaw`
    WITH mapping(source, target) AS (VALUES ${values})
    INSERT INTO "_ModuleToSemester" ("A", "B")
    SELECT mapping.target, relation."B" FROM mapping
    JOIN "_ModuleToSemester" relation ON relation."A" = mapping.source
    ON CONFLICT DO NOTHING`;
      await tx.$executeRaw`
    WITH mapping(source, target) AS (VALUES ${values})
    UPDATE "Review" SET "moduleId" = mapping.target FROM mapping WHERE "moduleId" = mapping.source`;
      await tx.$executeRaw`
    WITH mapping(source, target) AS (VALUES ${values})
    UPDATE "Module" SET "canonicalModuleId" = mapping.target FROM mapping WHERE id = mapping.source`;
      if (
        (await tx.review.count()) !== beforeReviews ||
        (await tx.reviewHelpful.count()) !== beforeVotes
      )
        throw new Error("Review/vote totals changed; consolidation rolled back.");
      if (
        await tx.review.count({ where: { moduleId: { in: pairs.map((pair) => pair.sourceId) } } })
      )
        throw new Error("Separate alias reviews remain; consolidation rolled back.");
      return report;
    },
    { timeout: 60000, maxWait: 10000 },
  );
