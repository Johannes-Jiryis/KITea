# Module import script

Import KIT module numbers and names into the KITea database and link them to a semester. Intended to be run manually at the beginning of each semester.

## Prerequisites

- PostgreSQL running with `DATABASE_URL` in `.env` or `.env.local`
- Prisma schema migrated: `npm run db:migrate`
- Dependencies installed: `npm install`

## Quick start

```bash
# Preview CSV import (no database writes)
npm run import:modules -- --source csv --file data/modules.example.csv --semester Wintersemester --year 2025 --dry-run --verbose

# Import for real
npm run import:modules -- --source csv --file data/modules.example.csv --semester Wintersemester --year 2025
```

## CLI reference

| Flag           | Description                                                                    |
| -------------- | ------------------------------------------------------------------------------ |
| `--source`     | **Required.** `csv`, `json`, or `campus`                                       |
| `--file`       | Input path (**required** for `csv` / `json`; **recommended** for `campus`)     |
| `--semester`   | `Wintersemester` or `Sommersemester` (aliases: `ws`, `ss`, `winter`, `summer`) |
| `--year`       | Four-digit year, e.g. `2025`                                                   |
| `--campus-url` | Optional URL to fetch for `campus` source                                      |
| `--dry-run`    | Parse and log actions without writing to the database                          |
| `--verbose`    | Enable debug logging                                                           |
| `--help`       | Show usage                                                                     |

If `--semester` is omitted, the script picks WS (Oct–Mar) or SS (Apr–Sep) based on the current date.

## Data sources

### 1. CSV (recommended)

**File:** `data/modules.example.csv`

| Column          | Required | Aliases                           |
| --------------- | -------- | --------------------------------- |
| `module_number` | Yes      | `modulenummer`, `number`, `lv_nr` |
| `module_name`   | Yes      | `modulename`, `name`, `title`     |
| `description`   | No       | `beschreibung`, `summary`         |

```bash
npm run import:modules -- --source csv --file ./my-modules.csv --semester Sommersemester --year 2026
```

### 2. JSON

**File:** `data/modules.example.json`

Supports either a bare array or `{ "semester": { ... }, "modules": [ ... ] }`. CLI `--semester` / `--year` override JSON metadata.

```bash
npm run import:modules -- --source json --file data/modules.example.json --year 2025
```

### 3. Campus catalog (scraping abstraction)

Official KIT course catalog (JavaScript SPA):

[KIT Campus — Course Catalog](https://campus.studium.kit.edu/english/events/catalog.php#!campus/all/fields.asp?group=Vorlesungsverzeichnis)

The live page loads content in the browser; a plain HTTP fetch often returns little module data. **Recommended workflow:**

1. Open the catalog in your browser and export or save the listing (HTML).
2. Import the saved file:

```bash
npm run import:modules -- --source campus --file ./exports/catalog-ws2025.html --semester Wintersemester --year 2025
```

Optional live fetch (best-effort):

```bash
npm run import:modules -- --source campus --campus-url "https://example.com/your-export.csv" --semester Wintersemester --year 2025
```

The campus parser (`scripts/lib/sources/campus-parser.ts`) uses heuristics for:

- Numeric LV numbers (`2400123`)
- Faculty codes (`MA-101`, `CS-201`)
- Table rows and `LV-Nr.` patterns

Extend `CampusModuleSource` or add a new `ModuleImportSource` implementation for future APIs (e.g. headless browser, Stud.IP JSON:API).

## Duplicate handling

The maintained importer rejects recognizable timetable rows, location-only labels, and catalog headings as module titles. It does not infer that unfamiliar or short academic titles are invalid.

To preview existing catalog metadata cleanup, run `npm exec tsx -- scripts/clean-module-catalog.ts`. Add `--apply` to remove confirmed metadata rows without reviews. Cleanup saves module records and semester IDs under ignored `.work/` before deleting, locks affected rows, and checks for new reviews before committing. It preserves `M-*` module records and all reviewed entries. Keep the backup outside an ephemeral deployment before running cleanup on a remote database.

- Input rows are deduplicated by normalized `moduleNumber`.
- Existing modules are matched by **unique** `moduleNumber`.
- If the module exists but is not linked to the target semester → **linked**.
- If already linked to that semester → **skipped**.
- New `moduleNumber` → **created** and linked.

## Logging

Logs are written to stdout with ISO timestamps:

```
[2025-10-01T12:00:00.000Z] [INFO] Created module: MA-101 — Linear Algebra I
[2025-10-01T12:00:00.100Z] [INFO] Linked existing module: CS-100
```

Use `--verbose` for debug-level details.

## Architecture

```
scripts/import-modules.ts       # CLI entry
scripts/lib/
  cli.ts                        # Argument parsing
  importer.ts                   # Prisma upsert logic
  parsers/                      # CSV + JSON parsers
  sources/                      # Pluggable sources (csv, json, campus)
    types.ts                    # ModuleImportSource interface
```

To add a new source, implement `ModuleImportSource` and register it in `scripts/lib/sources/index.ts`.

## Schema notes

`Module.moduleNumber` and `Semester (name, year)` are unique in Prisma. Run migrations after pulling schema changes:

```bash
npm run db:migrate
```

## Troubleshooting

| Issue                         | Fix                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL is not set`     | Add `DATABASE_URL` to `.env.local`                                             |
| Campus source finds 0 modules | Use CSV/JSON or save catalog HTML with `--file`                                |
| Unique constraint error       | Module already exists with different casing; normalization should prevent this |
| Prisma client errors          | Run `npm run prisma:generate`                                                  |
