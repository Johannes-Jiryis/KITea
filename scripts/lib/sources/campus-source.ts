import { readFile } from "node:fs/promises";

import type { Logger } from "../logger";
import type { ImportModuleRecord } from "../types";
import { parseCampusCatalogText } from "./campus-parser";
import type { ModuleImportSource, ModuleSourceContext } from "./types";

export const KIT_CAMPUS_CATALOG_URL =
  "https://campus.studium.kit.edu/english/events/catalog.php#!campus/all/fields.asp?group=Vorlesungsverzeichnis";

export type CampusFetcher = (url: string) => Promise<string>;

const defaultFetcher: CampusFetcher = async (url) => {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "KITea-module-import/1.0 (+https://github.com/kitea)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Campus fetch failed (${response.status}): ${url}`);
  }

  return response.text();
};

export class CampusModuleSource implements ModuleImportSource {
  readonly name = "campus";

  constructor(
    private readonly logger: Logger,
    private readonly fetcher: CampusFetcher = defaultFetcher,
  ) {}

  async load(context: ModuleSourceContext): Promise<ImportModuleRecord[]> {
    let content: string;

    if (context.filePath) {
      this.logger.info(`Reading campus export from file: ${context.filePath}`);
      content = await readFile(context.filePath, "utf8");
    } else {
      const url = context.fetchUrl ?? KIT_CAMPUS_CATALOG_URL;
      this.logger.info(`Fetching KIT campus catalog`, { url });
      this.logger.warn(
        "The live catalog is a JavaScript SPA; fetch may return little data. Prefer --file with a saved export.",
      );
      content = await this.fetcher(url);
    }

    const records = parseCampusCatalogText(content);

    if (records.length === 0) {
      throw new Error(
        [
          "No modules parsed from campus source.",
          "The KIT course catalog is rendered client-side:",
          KIT_CAMPUS_CATALOG_URL,
          "",
          "Try one of:",
          "  1. Export modules to CSV and run: --source csv --file data/modules.csv",
          "  2. Save catalog HTML in the browser and run: --source campus --file export.html",
          "  3. Pass a custom JSON/CSV URL: --source campus --campus-url <url>",
        ].join("\n"),
      );
    }

    this.logger.info(`Parsed ${records.length} module(s) from campus source`);
    return records;
  }
}
