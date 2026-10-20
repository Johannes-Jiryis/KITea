# Production audit

Baseline: `9e61383`, reviewed and improved 2026-10-19. The original improvement prompt is preserved. This report separates local verification from deployment-specific release gates.

## Subsequent UI simplification and catalog cleanup

At the owner's request, cookie prompts/settings, analytics rendering, legal/project-information pages and links, and the recent/popular homepage sections were removed. Theme selection uses the existing theme library with browser preference storage. Earlier consent and legal-page findings below describe the previous implementation.

The configured database contained 5,894 modules, including imported timetable rows and catalog metadata. After explicit approval of the complete list in [the cleanup record](CATALOG_CLEANUP_REVIEW.md), 561 entries with no reviews were backed up and deleted transactionally. Post-cleanup verification found 5,333 modules, no remaining matches for the metadata rules, and all 403 imported Wintersemester 2026/27 modules still linked. Reviewed entries and M-\* modules were excluded. The maintained importer now rejects these known metadata titles. Unfamiliar course names are preserved; this is not a claim that every remaining catalog entry was independently authenticated.

Verification for these changes: lint, application and import-script typechecks, formatting checks, and 38 unit tests passed. The connected database still has the previously reported pending readiness migration; cleanup did not apply schema migrations.

## Confirmed baseline issues and changes

Vercel preparation (2026-10-20): added Git-based build configuration with explicit Prisma generation and a Dublin region aligned to the current Supabase location. Vercel instances use one database connection and a five-second idle timeout. Serverless production connections enforce TLS certificate/hostname verification, with `DATABASE_CA_CERT` support for Supabase's shared-pooler CA; conflicting URL SSL flags cannot disable verification. A live read-only TLS probe without the CA reproduced certificate rejection (P1011); it did not change the database or local environment file. Downloading the correct CA and validating connectivity/OAuth on the actual Vercel deployment remain operator steps. Local Vercel-mode builds use synthetic credentials and an unreachable placeholder database.

Module-page latency follow-up (2026-10-20): shared the request-scoped module lookup between metadata and content, replaced multi-statement read transactions with single-statement review pagination and aggregate queries, and narrowed connection retries to individual reads. A small remote database diagnostic improved from 647–764 ms warm to 348–400 ms warm; subsequent signed-out localhost HTTP requests took 1,573/495/558 ms. These are diagnostic samples, not production latency guarantees. See [the performance check](MODULE_PAGE_PERFORMANCE.md) for methods and limits.

Anonymous review display (2026-10-20): review cards use a fixed anonymous label and generic avatar. Both public review GET contracts omit author identity, including user IDs. Personalized review lists expose only a server-derived `isOwnReview` boolean. The application retains ownership internally for authorization and account deletion. Regression coverage checks public responses, owner versus other-viewer flags, generic rendering even with legacy author props, and preservation of owner actions/self-vote restrictions. This supersedes earlier projections that allowed author name/image.

Account deletion is available on the profile page with typed confirmation. The server action derives the target exclusively from the session; a user row lock serializes deletion with existing review/vote writes. A transaction deletes owned reviews and identity-associated verification/rate-limit records, then the user; existing foreign keys cascade linked OAuth accounts, sessions, votes, and submission history. Affected module pages are invalidated, and Auth.js clears this browser's login cookie. The JWT callback checks that an existing account still exists, so tokens on other devices lose access on their next server session request. No schema migration is needed. Verification: 49 unit tests, 15 disposable PostgreSQL integration tests (including rollback and preservation of another user's data), and the browser review/account lifecycle passed, along with lint and application/import typechecks. No live accounts were deleted by verification.

Follow-up connection handling: intermittent Supabase timeouts persisted after increasing the connection deadline. Module/search reads now retry a recognized connection failure once; no writes are replayed. Persistent module connection failures return a recovery UI and fallback metadata instead of throwing that expected outage through the development overlay. Seven targeted tests cover retry limits, non-retryable errors, cyclic causes, fallback rendering, metadata, and preservation of unexpected errors. A subsequent 12-operation live read check had no failures; this is limited evidence, not a resolution of the underlying intermittent network/pooler condition.

| Priority | Evidence                                                                        | Impact                                          | Implemented change                                                                                             |
| -------- | ------------------------------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P0       | Public review GET routes selected `user.email`                                  | Author email disclosure                         | Explicit public projections and response privacy tests                                                         |
| P0       | Catalog highlight HTML and custom Markdown URL interpolation                    | Stored/imported HTML and attribute injection    | React text highlights, maintained Markdown renderer, no raw HTML or remote Markdown images                     |
| P1       | REST review writes skipped form validation and throttling                       | Invalid data and inconsistent controls          | Shared mutation service, bounded same-origin JSON requests, typed HTTP failures                                |
| P1       | Review summary length checked before trimming                                   | Whitespace-only summaries accepted              | Trim before length validation; finite half-star ratings and field limits                                       |
| P1       | Active search was unordered `contains`; SQL alternative unused                  | Arbitrary relevance and duplicated code         | Canonical parameterized, bounded ranked query used by actual API                                               |
| P1       | Unused SQL limited by ID before relevance sorting                               | Best matches omitted                            | Rank candidates before deterministic final limit                                                               |
| P1       | Search tokenized names per request and aggregated catalog reviews               | Avoidable growing query work                    | Stored generated vector, GIN indexes, no autocomplete review aggregates; fuzzy work only when needed           |
| P1       | Old search completion cleared newer loading state                               | Flicker and stale completions                   | Request generation guards with abort/debounce regression tests                                                 |
| P1       | Counts checked before review insertion; deletion erased history                 | Concurrent submission and deletion bypasses     | Per-user row locks and durable submission events; write-attempt budgets survive failed validation              |
| P1       | Helpful toggle used read/create/delete without serialization                    | Conflicting votes or failures under concurrency | User/review row locks and consistent count retrieval                                                           |
| P1       | Module details, stats, personal lists and popular modules loaded unbounded data | Growing memory, payloads and latency            | Database ordering/aggregates, review pages of 20, selective vote counts/current-user state                     |
| P1       | Helpful invalidation used ID instead of module-number path                      | Stale pages                                     | Shared canonical invalidation, including old/new module when a review moves                                    |
| P1       | Runtime lacked bounded database waits                                           | Long failure paths and excessive pools          | Five connections/instance, ten-second connect wait, five-second statement timeout, explicit transaction bounds |
| P1       | Production configuration accepted weak/development fallback paths               | Insecure deployments could appear healthy       | Required credentials/HTTPS/strong secret, no production validation bypass, startup/readiness validation        |
| P1       | Dependencies had critical advisories                                            | Known framework/authentication exposure         | Compatible Next/Auth.js security updates; aligned Prisma 7.10.1; patched PostCSS override                      |
| P1       | No CI, production migration command, probes or runbook                          | Unreproducible releases                         | npm lock/runtime pin, CI, Docker stages, migration command, probes, smoke test and runbook                     |
| P2       | Review form returned before later hooks                                         | Conditional hook order                          | All hooks run consistently; session-loading redirects handled                                                  |
| P2       | Recent modules ordered by ID                                                    | Ambiguous recency                               | New nullable creation timestamp; historical timestamps deliberately remain unknown                             |
| P2       | Prisma/import CLI loaded different env files from Next                          | Broken setup/migration commands                 | Explicit shell > .env.local > .env precedence for maintained commands                                          |
| P2       | Theme stored without preference consent; string values coerced to consent       | Consent behavior differed from UI               | In-memory theme without consent, removal on revocation, exact boolean consent checks                           |

## Baseline execution

- Original locked installation succeeded using npm 10.9.2, Node 22.14.0. PowerShell blocks `npm.ps1`; commands used `npm.cmd`.
- Original sources were extracted to ignored `.work/baseline` for baseline checks, preserving the working checkout.
- Original Prisma generation and application typecheck passed.
- Original lint failed: 16 errors and one warning, including conditional hooks, reserved module variables and unescaped text.
- Original formatting check failed for 184 files, including skill documents. Source formatting now follows the existing declared Prettier configuration; skill files, original prompt and generated artifacts are excluded.
- Original import-script typecheck failed with TS6059: historical scripts imported files outside the configured root. The maintained CLI has its own verified scope; the application typecheck still checks repository TypeScript.
- Original build failed fetching Inter/Geist Mono from Google Fonts under restricted networking. Fonts are now bundled, with the same font families.
- No Docker, system PostgreSQL or production credentials were used. Test PostgreSQL 17.6 was installed as a development-only dependency and ran on loopback with synthetic data.

## Local verification

- Prisma generation and schema validation: passed with aligned Prisma 7.10.1.
- Unit suite: 24 tests passed, covering malicious rendering, input validation, overlapping requests, HTTP boundaries and analytics/theme consent.
- PostgreSQL integration suite: 12 tests passed, covering ranking, literal wildcards, German/multiword/typo inputs, authorization via actions and REST, privacy, duplicates, concurrent submissions/votes, retained rate limits, pagination/statistics and idempotent dry-run imports.
- Browser lifecycle: passed in Chromium with an isolated signed Auth.js session: search, module navigation, review creation, editing and deletion. This does not test live Google OAuth.
- Fresh migration application and repeat deployment: passed.
- Upgrade from the two original migrations with existing user/module/review data: passed; reviews preserved, unknown timestamps retained and recent submission history backfilled.
- Lint, both TypeScript checks and formatting check: passed after fixes. Formatting was normalized using the existing declared configuration.
- Final production build: passed with Next 15.5.28 and Node middleware, retaining a separate adapter-free auth config.
- Standalone production artifact smoke tests: passed with both healthy disposable PostgreSQL and an unavailable database. Verified homepage/static assets, security headers, liveness, readiness/search success or bounded 503 failures, and unauthenticated protected-page redirects. Processes and disposable PostgreSQL were stopped after verification.
- Search: completed benchmark with zero failures. At 20 concurrent clients / 1,000 samples, final ranked handler p95 was 109.84 ms for 3,124 modules and 107.51 ms for 10,000 modules/100,000 reviews. The original simpler unordered search was faster (69.50/74.15 ms); the change adds relevance and typo tolerance within the proposed budget, not a claimed speedup over that simpler contract.
- Benchmark scope excludes Next routing/middleware, TLS, WAN and debounce. See `SEARCH_BENCHMARK.md`, JSON results and committed query plans. Production ingress capacity remains unverified.
- `npm audit --omit=dev`: zero vulnerabilities. Full development audit reports five high-severity entries in one unpatched `braces -> micromatch -> fast-glob -> Next ESLint plugin` chain. The suggested forced downgrade to Next 14 lint tooling was not applied. This tooling operates on trusted repository patterns and is excluded from the standalone runtime; it remains a maintenance item.
- A PostgreSQL driver deprecation warning about overlapping client queries occurs in relation/transaction execution. Current pinned pg 8 behavior passes integration tests; review upstream adapter changes before any pg 9 upgrade.

## Remaining operator release gates

These are unverified external conditions, not completed deployment claims:

1. Build and scan the Linux Docker images and run CI remotely; this host has no Docker.
2. Verify migrations and index build duration on a restored representative database. Normal index creation can block writes; plan maintenance for large installations.
3. Configure managed PostgreSQL TLS/roles/pooling/backups, test restore/recovery and monitor autovacuum after imports.
4. Set canonical hostname, ingress headers/body/rate/time limits, random production session secret and real Google OAuth credentials; verify login/logout through HTTPS.
5. Supply owner-provided legal identity and hosting/contact information; review the actual privacy and retention policy. Analytics and theme gating tests do not certify legal compliance.
6. Schedule `db:maintenance` for expired rate-limit keys and submission events older than 30 days.
7. Run the full API benchmark through the real ingress and measure saturation, cold starts, error recovery and shutdown behavior.

At the initial production-readiness verification, no production database had been queried or changed and no application had been published or deployed. Subsequent explicitly authorized catalog maintenance is recorded below and in its linked reports.

## Handbook-based consolidation, 20 October 2026

The user supplied the 10 September 2026 Informatik Master PDF and approved adding alias support and consolidating the reviewed 359 course/parent candidates in the connected Supabase database. A complete PDF extraction revealed reused course numbers, title translations, and historical-semester differences. Final number/title/semester checks narrowed application to 114 aliases across 81 parents. The other 245 initially listed candidates remain unchanged pending further evidence; eligible entries outside the approved set were also excluded.

The additive migration and verified aliases were applied after explicit approval. No modules or reviews were deleted. Both existing reviews were already on parents and remain intact; there are no separate alias reviews. Affected records and relationships were backed up privately before mutation, and a repeated scoped dry run proposed zero new aliases. Read-only checks verified the Machine Learning lecture/exercise and Sampling Methods examples resolve to their correct parents. Search deduplicates before its final limit; legacy URLs, APIs, form options and writes resolve the same parent. Imports reject reused numeric identifiers with different titles.

Validation: 59 unit tests, 22 PostgreSQL integration tests, 3 Python extraction tests, fresh/repeated/upgrade migrations, lint, both TypeScript projects, a Chromium search/redirect/review/account lifecycle test, and an isolated Vercel-mode production build passed. The build used synthetic environment values and did not contact the production database. See [the exact applied scope and remaining entries](MODULE_CONSOLIDATION_REVIEW.md) and [the runbook](MODULE_CONSOLIDATION.md). Live deployment verification of the matching revision is a separate step.

## Sources used for implementation decisions

- [Next.js 15.5: stable Node middleware](https://nextjs.org/blog/next-15-5)
- [Prisma 7 system requirements](https://www.prisma.io/docs/orm/v7/reference/system-requirements)
- [PostgreSQL trigram indexes](https://www.postgresql.org/docs/15/pgtrgm.html)
- [react-markdown security](https://github.com/remarkjs/react-markdown#security)

Dependency decisions also used installed package metadata and npm's current advisory responses. No broad framework major migration was required.

Formatting for this change was checked against the explicit Git source-file list using Prettier and its existing ignores. The usual whole-directory command encountered Windows permissions on ignored temporary work directories; this does not affect a clean CI checkout.
