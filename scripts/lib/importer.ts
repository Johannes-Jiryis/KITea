import type { PrismaClient } from "@prisma/client";

import type { Logger } from "./logger";
import { dedupeModules } from "./normalize";
import { moduleTitleIssue } from "./module-title";
import type {
  ImportModuleRecord,
  ImportOptions,
  ImportResult,
  ImportStats,
  SemesterName,
} from "./types";

export async function resolveSemester(
  prisma: PrismaClient,
  name: SemesterName,
  year: number,
  dryRun: boolean,
  logger: Logger,
) {
  const existing = await prisma.semester.findUnique({
    where: { name_year: { name, year } },
  });

  if (existing) {
    logger.debug("Found existing semester", { id: existing.id, name, year });
    return existing;
  }

  if (dryRun) {
    logger.info(`[dry-run] Would create semester: ${name} ${year}`);
    return { id: "dry-run-semester-id", name, year };
  }

  const created = await prisma.semester.create({
    data: { name, year },
  });
  logger.info(`Created semester: ${name} ${year}`, { id: created.id });
  return created;
}

export async function importModules(
  prisma: PrismaClient,
  records: ImportModuleRecord[],
  options: ImportOptions,
  logger: Logger,
): Promise<ImportResult> {
  const uniqueRecords = dedupeModules(records);
  const invalid = uniqueRecords.filter((record) => moduleTitleIssue(record.moduleName));
  if (invalid.length) {
    throw new Error(
      `Import contains ${invalid.length} catalog metadata row(s), not module titles. Remove these entries before importing: ${invalid
        .slice(0, 10)
        .map((record) => record.moduleNumber)
        .join(", ")}`,
    );
  }
  const semester = await resolveSemester(
    prisma,
    options.semesterName,
    options.semesterYear,
    options.dryRun,
    logger,
  );

  const stats: ImportStats = {
    totalInput: records.length,
    uniqueInput: uniqueRecords.length,
    created: 0,
    linked: 0,
    skipped: 0,
    errors: 0,
  };

  for (const record of uniqueRecords) {
    try {
      const outcome = await upsertModuleForSemester(
        prisma,
        record,
        semester.id,
        options.dryRun,
        logger,
      );
      stats[outcome]++;
    } catch (error) {
      stats.errors++;
      logger.error(`Failed to import ${record.moduleNumber}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    stats,
    semesterId: options.dryRun ? null : semester.id,
    semesterLabel: `${options.semesterName} ${options.semesterYear}`,
  };
}

async function upsertModuleForSemester(
  prisma: PrismaClient,
  record: ImportModuleRecord,
  semesterId: string,
  dryRun: boolean,
  logger: Logger,
): Promise<"created" | "linked" | "skipped"> {
  const existing = await prisma.module.findUnique({
    where: { moduleNumber: record.moduleNumber },
    include: {
      semesters: { where: { id: semesterId }, select: { id: true } },
    },
  });

  if (existing) {
    const alreadyLinked = existing.semesters.length > 0;

    if (alreadyLinked) {
      logger.debug(`Skip (already linked): ${record.moduleNumber}`);
      return "skipped";
    }

    if (dryRun) {
      logger.info(`[dry-run] Would link ${record.moduleNumber} → semester ${semesterId}`);
      return "linked";
    }

    await prisma.module.update({
      where: { id: existing.id },
      data: {
        semesters: { connect: { id: semesterId } },
        ...(record.description ? { description: record.description } : {}),
      },
    });

    logger.info(`Linked existing module: ${record.moduleNumber}`);
    return "linked";
  }

  if (dryRun) {
    logger.info(`[dry-run] Would create ${record.moduleNumber} — ${record.moduleName}`);
    return "created";
  }

  await prisma.module.create({
    data: {
      moduleNumber: record.moduleNumber,
      moduleName: record.moduleName,
      description: record.description ?? null,
      semesters: { connect: { id: semesterId } },
    },
  });

  logger.info(`Created module: ${record.moduleNumber} — ${record.moduleName}`);
  return "created";
}
