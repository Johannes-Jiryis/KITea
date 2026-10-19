import { readFile } from "node:fs/promises";

import type { ImportModuleRecord } from "../types";
import { normalizeModuleNumber } from "../normalize";

const MODULE_NUMBER_HEADERS = ["module_number", "modulenummer", "number", "lv_nr"] as const;

const MODULE_NAME_HEADERS = ["module_name", "modulename", "name", "title"] as const;

type CsvRow = Record<string, string>;

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function rowsFromCsv(content: string, delimiter = ","): CsvRow[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0], delimiter).map((header) =>
    header.trim().toLowerCase().replace(/\s+/g, "_"),
  );

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line, delimiter);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = cells[index]?.trim() ?? "";
    });
    return row;
  });
}

function rowToRecord(row: CsvRow): ImportModuleRecord | null {
  const moduleNumber = normalizeModuleNumber(
    row.module_number ?? row.modulenummer ?? row.number ?? row.lv_nr ?? "",
  );
  const moduleName = row.module_name ?? row.modulename ?? row.name ?? row.title ?? "";

  if (!moduleNumber || !moduleName.trim()) return null;

  const description = row.description ?? row.beschreibung ?? row.summary ?? undefined;

  return {
    moduleNumber,
    moduleName: moduleName.trim(),
    description: description?.trim() || undefined,
  };
}

export async function parseCsvFile(filePath: string): Promise<ImportModuleRecord[]> {
  const content = await readFile(filePath, "utf8");
  const rows = rowsFromCsv(content);

  if (rows.length === 0) {
    throw new Error(`CSV file is empty: ${filePath}`);
  }

  const headers = Object.keys(rows[0]);
  const hasNumber = MODULE_NUMBER_HEADERS.some((header) => headers.includes(header));
  const hasName = MODULE_NAME_HEADERS.some((header) => headers.includes(header));

  if (!hasNumber || !hasName) {
    throw new Error(
      `CSV must include module number and name columns. Found: ${headers.join(", ")}`,
    );
  }

  const records = rows
    .map(rowToRecord)
    .filter((record): record is ImportModuleRecord => record !== null);

  if (records.length === 0) {
    throw new Error(`No valid module rows parsed from CSV: ${filePath}`);
  }

  return records;
}
