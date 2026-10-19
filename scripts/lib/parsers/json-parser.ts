import { readFile } from "node:fs/promises";
import { z } from "zod";

import { normalizeModuleNumber } from "../normalize";
import type { ImportModuleRecord } from "../types";

const moduleSchema = z.object({
  moduleNumber: z.string().min(1).optional(),
  module_number: z.string().min(1).optional(),
  moduleName: z.string().min(1).optional(),
  module_name: z.string().min(1).optional(),
  description: z.string().optional(),
});

const fileSchema = z.union([
  z.array(moduleSchema),
  z.object({
    modules: z.array(moduleSchema),
    semester: z
      .object({
        name: z.string().optional(),
        year: z.number().int().optional(),
      })
      .optional(),
  }),
]);

export type JsonParseMetadata = {
  semesterName?: string;
  semesterYear?: number;
};

export async function parseJsonFile(
  filePath: string,
): Promise<{ records: ImportModuleRecord[]; metadata: JsonParseMetadata }> {
  const raw = await readFile(filePath, "utf8");
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in file: ${filePath}`);
  }

  const validated = fileSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `JSON schema invalid: ${validated.error.errors.map((issue) => issue.message).join("; ")}`,
    );
  }

  const data = validated.data;
  const modules = Array.isArray(data) ? data : data.modules;
  const metadata: JsonParseMetadata = Array.isArray(data)
    ? {}
    : {
        semesterName: data.semester?.name,
        semesterYear: data.semester?.year,
      };

  const records: ImportModuleRecord[] = [];

  for (const item of modules) {
    const moduleNumber = normalizeModuleNumber(item.moduleNumber ?? item.module_number ?? "");
    const moduleName = (item.moduleName ?? item.module_name ?? "").trim();

    if (!moduleNumber || !moduleName) continue;

    records.push({
      moduleNumber,
      moduleName,
      description: item.description?.trim() || undefined,
    });
  }

  if (records.length === 0) {
    throw new Error(`No valid modules found in JSON: ${filePath}`);
  }

  return { records, metadata };
}
