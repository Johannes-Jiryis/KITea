# KITea

A module review platform for KIT students, built with Next.js App Router, React, TypeScript, Prisma, PostgreSQL and Google OAuth.

## Local setup

Use the Node 22 patch pinned in `.nvmrc` and npm 10.9.2. Node 22.14+ is the minimum tested local version; deployment and CI use the pinned patched runtime.

1. Run `npm ci` (Windows PowerShell: `npm.cmd ci`).
2. Copy `.env.example` to `.env.local` and configure a development PostgreSQL database and Google OAuth application.
3. Run `npm run prisma:generate`, then `npm run db:deploy`.
4. Run `npm run dev`.

The app, Prisma CLI and maintained import CLI load shell variables first, then `.env.local`, then `.env`. Keep secrets out of source control. OAuth callback: `http://localhost:3000/api/auth/callback/google`.

Use `npm run db:migrate -- --name descriptive_name` only when developing a new migration. Deploy committed migrations with `npm run db:deploy`.

## Verification

Account deletion is available under **Profile → Delete account**. Users must type `DELETE` before confirming. Deletion removes their reviews, helpful votes, linked login records, sessions, and submission history in one transaction, then signs them out. Existing JWTs are rejected when the deleted user next requests a server session. The module catalog and other users' reviews remain. No additional migration is required. Database backup retention remains an operator responsibility.

```sh
npm run prisma:generate
npm run db:validate
npm run check
npm run test:integration
npx playwright install chromium
npm run test:e2e
npm run build
npm run test:smoke
npm run test:smoke:db
npm audit --omit=dev --audit-level=high
```

Generation/validation requires a syntactically valid `DATABASE_URL`, even without a live database. A build can use `postgresql://build:build@127.0.0.1:1/build`; builds do not run migrations or seed data.

Integration, browser and benchmark commands start PostgreSQL 17 on loopback port 55432 using the development-only `embedded-postgres` package. They create fresh databases, use test-only identity and secrets, and stop PostgreSQL afterward. Never point them at an existing database. Run these commands sequentially because the port is shared. On Linux, run as a normal user; the runner never creates OS accounts. Files remain under ignored `.work/` for inspection.

Browser tests use a signed local Auth.js test session on port 3101, with isolated build output in `.work/next-e2e`; they do not bypass production authentication or contact Google. They cover review actions, account deletion, cancellation, and stale-session rejection. Real Google OAuth must still be verified on the deployed hostname.

## Search and data access

Handbook-confirmed lectures and exercises share their parent module's review page. Search accepts legacy course names/numbers and returns the parent once; old links redirect there. Numeric course identifiers can be reused, so consolidation checks the handbook title and semester as well. See [the applied mapping and remaining candidates](docs/MODULE_CONSOLIDATION_REVIEW.md) and [the consolidation runbook](docs/MODULE_CONSOLIDATION.md) before changing catalog relationships.

Search uses one parameterized PostgreSQL query with exact-code, prefix, full-text, substring and trigram relevance, deterministic ordering and a ten-result bound. It returns plain text. Two-character terms use literal substring/word matching; typo tolerance starts at three characters. Unicode compatibility forms and whitespace are normalized. Accents are preserved; transliteration is not promised. See [search benchmarks](docs/SEARCH_BENCHMARK.md).

Review pages and APIs paginate in batches of 20 and perform filtering and sorting in the database. Aggregate statistics cover the entire module. Public responses omit author emails and other users' vote identities. Review REST mutations and server actions share validation, ownership checks, durable submission limits and invalidation. See [the audit](docs/PRODUCTION_AUDIT.md).

Reviews display as **Anonymous student** with a generic avatar. Public review responses omit author names, photos, and user IDs. Personalized lists include only an `isOwnReview` flag for edit/delete controls; server-side ownership checks still protect mutations. Account/profile information remains visible to its signed-in owner.

## Importing modules

```sh
npm run import:modules -- --source csv --file data/modules.example.csv --semester Wintersemester --year 2026 --dry-run
```

Inspect the dry run before importing into the intended database. Remove `--dry-run` only when ready. The maintained CLI supports CSV, JSON and saved campus exports. The historical winter-import scripts are preserved for reference, excluded from the maintained CLI typecheck and never run automatically. See [import documentation](docs/MODULE_IMPORT.md).

## Deployment

For Vercel with the existing Supabase database, follow [the Vercel deployment guide](docs/VERCEL_DEPLOYMENT.md). The repository supplies build settings and a Dublin function region; confirm it matches your actual database location.

For self-hosted Linux Docker behind an HTTPS reverse proxy, see the [Docker deployment runbook](docs/DEPLOYMENT.md) for build-time public settings, runtime secrets, migration ordering, health probes, pooling, backups, rollback and operator release gates.

Local fonts are bundled; builds do not contact Google Fonts. The app does not load analytics or display cookie prompts. Theme choices persist in browser storage.

Nothing in the local tooling publishes the app or modifies production databases automatically.
