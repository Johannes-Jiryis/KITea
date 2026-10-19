import { parseJsonFile } from "../parsers/json-parser";
import type { ModuleImportSource, ModuleSourceContext } from "./types";

export type JsonSourceResult = {
  records: Awaited<ReturnType<typeof parseJsonFile>>["records"];
  metadata: Awaited<ReturnType<typeof parseJsonFile>>["metadata"];
};

export class JsonModuleSource implements ModuleImportSource {
  readonly name = "json";
  metadata: JsonSourceResult["metadata"] = {};

  async load(context: ModuleSourceContext) {
    if (!context.filePath) {
      throw new Error("JSON source requires --file <path>");
    }
    const { records, metadata } = await parseJsonFile(context.filePath);
    this.metadata = metadata;
    return records;
  }
}
