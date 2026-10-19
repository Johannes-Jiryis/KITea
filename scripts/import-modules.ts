#!/usr/bin/env node
/**
 * KITea module import CLI
 *
 * Run at the start of each semester to load module numbers/names
 * and associate them with a Semester in PostgreSQL via Prisma.
 */
import "./load-env";

import { parseCli, printHelp } from "./lib/cli";
import { importModules } from "./lib/importer";
import { Logger } from "./lib/logger";
import { createScriptPrisma } from "./lib/prisma";
import { createModuleSource } from "./lib/sources";
import { JsonModuleSource } from "./lib/sources/json-source";

async function main() {
  const cli = parseCli(process.argv.slice(2));

  if (cli.help) {
    printHelp();
    return;
  }

  const logger = new Logger(cli.verbose);
  logger.info("KITea module import started", {
    source: cli.source,
    semester: `${cli.semesterName} ${cli.semesterYear}`,
    dryRun: cli.dryRun,
    file: cli.file,
  });

  const source = createModuleSource(cli.source, logger);
  const records = await source.load({
    filePath: cli.file,
    fetchUrl: cli.campusUrl,
    verbose: cli.verbose,
  });

  if (source instanceof JsonModuleSource) {
    if (source.metadata.semesterName) {
      logger.info(
        `JSON metadata semester name "${source.metadata.semesterName}" (CLI --semester takes precedence)`,
      );
    }
    if (source.metadata.semesterYear) {
      logger.info(
        `JSON metadata semester year ${source.metadata.semesterYear} (CLI --year takes precedence)`,
      );
    }
  }

  logger.info(`Loaded ${records.length} module record(s) from ${cli.source}`);

  const prisma = createScriptPrisma();

  try {
    const result = await importModules(
      prisma,
      records,
      {
        semesterName: cli.semesterName,
        semesterYear: cli.semesterYear,
        dryRun: cli.dryRun,
        verbose: cli.verbose,
      },
      logger,
    );

    const { stats } = result;
    logger.info("Import finished", {
      semester: result.semesterLabel,
      dryRun: cli.dryRun,
      totalInput: stats.totalInput,
      uniqueInput: stats.uniqueInput,
      created: stats.created,
      linked: stats.linked,
      skipped: stats.skipped,
      errors: stats.errors,
    });

    if (stats.errors > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    `[${new Date().toISOString()}] [ERROR]`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
