import type { ImportModuleRecord } from "../types";

export type ModuleSourceContext = {
  filePath?: string;
  fetchUrl?: string;
  verbose?: boolean;
};

/**
 * Pluggable source for module records (CSV, JSON, campus scraper, future APIs).
 */
export interface ModuleImportSource {
  readonly name: string;
  load(context: ModuleSourceContext): Promise<ImportModuleRecord[]>;
}
