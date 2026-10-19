import { parseArgs } from "node:util";

import { normalizeSemesterName } from "./normalize";
import type { SemesterName } from "./types";
import type { SourceType } from "./sources";

export type CliOptions = {
  source: SourceType;
  file?: string;
  campusUrl?: string;
  semesterName: SemesterName;
  semesterYear: number;
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
};

const HELP_TEXT = `
KITea — Module import script

Usage:
  npm run import:modules -- --source <csv|json|campus> [options]

Required:
  --source <type>          Import source: csv, json, or campus

Options:
  --file <path>            Input file (required for csv/json; recommended for campus)
  --semester <name>        Wintersemester | Sommersemester (aliases: ws, ss)
  --year <yyyy>            Academic year, e.g. 2025
  --campus-url <url>       Custom fetch URL for campus source
  --dry-run                Parse and log without writing to the database
  --verbose                Debug logging
  --help                   Show this help

Examples:
  npm run import:modules -- --source csv --file data/modules.example.csv --semester Wintersemester --year 2025
  npm run import:modules -- --source json --file data/modules.example.json --dry-run --verbose
  npm run import:modules -- --source campus --file exports/catalog.html --semester Sommersemester --year 2026

KIT course catalog (SPA, often needs HTML export):
  https://campus.studium.kit.edu/english/events/catalog.php
`.trim();

export function parseCli(argv: string[]): CliOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      source: { type: "string" },
      file: { type: "string" },
      semester: { type: "string" },
      year: { type: "string" },
      "campus-url": { type: "string" },
      "dry-run": { type: "boolean", default: false },
      verbose: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    allowPositionals: false,
  });

  if (values.help) {
    return {
      source: "csv",
      semesterName: "Wintersemester",
      semesterYear: new Date().getFullYear(),
      dryRun: false,
      verbose: false,
      help: true,
    };
  }

  const source = values.source as SourceType | undefined;
  if (!source || !["csv", "json", "campus"].includes(source)) {
    throw new Error("--source is required (csv | json | campus). Use --help for usage.");
  }

  if ((source === "csv" || source === "json") && !values.file) {
    throw new Error(`--file is required for source "${source}"`);
  }

  const semesterRaw = values.semester ?? inferDefaultSemesterName();
  const semesterName = normalizeSemesterName(semesterRaw);
  if (!semesterName) {
    throw new Error(`Invalid --semester "${semesterRaw}". Use Wintersemester or Sommersemester.`);
  }

  const yearRaw = values.year ?? String(new Date().getFullYear());
  const semesterYear = Number.parseInt(yearRaw, 10);
  if (
    !/^\d{4}$/.test(yearRaw) ||
    !Number.isFinite(semesterYear) ||
    semesterYear < 2000 ||
    semesterYear > 2100
  ) {
    throw new Error(`Invalid --year "${yearRaw}". Use a four-digit year.`);
  }

  return {
    source,
    file: values.file,
    campusUrl: values["campus-url"],
    semesterName,
    semesterYear,
    dryRun: values["dry-run"] ?? false,
    verbose: values.verbose ?? false,
    help: false,
  };
}

function inferDefaultSemesterName(): string {
  const month = new Date().getMonth() + 1;
  // KIT: WS default from October; SS from April
  return month >= 10 || month <= 3 ? "Wintersemester" : "Sommersemester";
}

export function printHelp() {
  console.log(HELP_TEXT);
}
