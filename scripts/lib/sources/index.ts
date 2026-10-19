import type { Logger } from "../logger";
import { CampusModuleSource } from "./campus-source";
import { CsvModuleSource } from "./csv-source";
import { JsonModuleSource } from "./json-source";
import type { ModuleImportSource } from "./types";

export type SourceType = "csv" | "json" | "campus";

export function createModuleSource(type: SourceType, logger: Logger): ModuleImportSource {
  switch (type) {
    case "csv":
      return new CsvModuleSource();
    case "json":
      return new JsonModuleSource();
    case "campus":
      return new CampusModuleSource(logger);
    default:
      throw new Error(`Unknown source type: ${type satisfies never}`);
  }
}

export type { ModuleImportSource, ModuleSourceContext } from "./types";
export { KIT_CAMPUS_CATALOG_URL } from "./campus-source";
