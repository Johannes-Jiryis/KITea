import { normalizeModuleNumber } from "../normalize";
import { moduleTitleIssue } from "../module-title";
import type { ImportModuleRecord } from "../types";

/**
 * Heuristic HTML/text parser for KIT campus catalog exports.
 *
 * The live catalog is a JavaScript SPA:
 * https://campus.studium.kit.edu/english/events/catalog.php
 *
 * Recommended workflow: export or save catalog HTML, then import with
 *   --source campus --file ./exports/catalog.html
 * or provide a custom fetch URL via --campus-url.
 */
export function parseCampusCatalogText(htmlOrText: string): ImportModuleRecord[] {
  const text = stripHtml(htmlOrText);
  const records = new Map<string, ImportModuleRecord>();

  const patterns: RegExp[] = [
    // Table style: | 2400123 | Linear Algebra I |
    /\|\s*(\d{5,9})\s*\|\s*([^|\n]{3,120}?)\s*\|/g,
    // LV-Nr.: 2400123 — Title
    /(?:LV-?Nr\.?|LVNr\.?|Lehrveranstaltungsnummer)[:\s]*(\d{5,9})\s*[-–—:]\s*([^\n]{3,120})/gi,
    // MA-101 Linear Algebra
    /\b([A-Z]{2,5}-\d{2,4})\b\s+([A-Za-z0-9][^\n,;|]{2,100})/g,
    // 2400123: Title
    /\b(\d{5,9})\s*[:–—-]\s*([^\n]{3,120})/g,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      addRecord(records, match[1], match[2]);
    }
  }

  return [...records.values()];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}

function addRecord(map: Map<string, ImportModuleRecord>, rawNumber: string, rawName: string) {
  const moduleNumber = normalizeModuleNumber(rawNumber);
  let moduleName = rawName.trim().replace(/\s+/g, " ");

  moduleName = moduleName
    .replace(/\|.*$/, "")
    .replace(/\b(Dozent|Lecturer|Typ|Type)\b.*$/i, "")
    .trim();

  if (!moduleNumber || moduleName.length < 3) return;
  if (moduleTitleIssue(moduleName)) return;
  if (/^\d+$/.test(moduleName)) return;

  const existing = map.get(moduleNumber);
  if (!existing || moduleName.length > existing.moduleName.length) {
    map.set(moduleNumber, { moduleNumber, moduleName });
  }
}
