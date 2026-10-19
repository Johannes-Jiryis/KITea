import { parseCsvFile } from "../parsers/csv-parser";
import type { ModuleImportSource, ModuleSourceContext } from "./types";

export class CsvModuleSource implements ModuleImportSource {
  readonly name = "csv";

  async load(context: ModuleSourceContext) {
    if (!context.filePath) {
      throw new Error("CSV source requires --file <path>");
    }
    return parseCsvFile(context.filePath);
  }
}
