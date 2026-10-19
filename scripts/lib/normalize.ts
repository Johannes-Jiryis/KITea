import type { ImportModuleRecord, SemesterName } from "./types";

/**
 * Normalizes KIT-style module numbers for deduplication.
 * Examples: "ma-101" → "MA-101", " 2400123 " → "2400123"
 */
export function normalizeModuleNumber(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return "";

  // Alphanumeric codes with hyphen (e.g. MA-101, CS-350)
  if (/^[a-zA-Z]{2,}-\d+$/i.test(trimmed)) {
    const [prefix, num] = trimmed.split("-");
    return `${prefix.toUpperCase()}-${num}`;
  }

  // Numeric campus LV numbers (e.g. 2400123)
  if (/^\d{5,9}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed.toUpperCase();
}

export function normalizeSemesterName(raw: string): SemesterName | null {
  const value = raw.trim().toLowerCase();
  if (value === "wintersemester" || value === "winter" || value === "ws") {
    return "Wintersemester";
  }
  if (value === "sommersemester" || value === "summer" || value === "ss") {
    return "Sommersemester";
  }
  return null;
}

export function dedupeModules(records: ImportModuleRecord[]): ImportModuleRecord[] {
  const map = new Map<string, ImportModuleRecord>();

  for (const record of records) {
    const key = normalizeModuleNumber(record.moduleNumber);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        ...record,
        moduleNumber: key,
        moduleName: record.moduleName.trim(),
      });
      continue;
    }

    // Prefer longer / non-empty names when duplicates appear in source data
    if (record.moduleName.trim().length > existing.moduleName.length) {
      map.set(key, {
        ...record,
        moduleNumber: key,
        moduleName: record.moduleName.trim(),
      });
    }
  }

  return [...map.values()];
}
