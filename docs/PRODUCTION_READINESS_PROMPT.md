# KITea improvement and deployment readiness prompt

Copy everything below the divider into a coding agent working in this repository.

This prompt is informed by a static review of commit `9e61383`. Dependencies were not installed, and no build, database queries, benchmarks, or runtime security tests were run during that review. Revalidate the findings against the current checkout.

---

Act as the engineer responsible for making KITea reliable, fast, secure, and ready for deployment. Inspect the repository, identify and prioritize issues, then implement and verify the improvements. Deliver working changes, not just an audit or plan.

KITea is a student module review platform built with Next.js App Router, React, TypeScript, Prisma with the PostgreSQL driver adapter, PostgreSQL, Auth.js/NextAuth Google OAuth, Tailwind, and shadcn/ui. Preserve its product behavior, visual identity, module catalog, reviews, half-star ratings, semester filters, helpful votes, and authentication.

Read applicable repository instructions first. Work in reviewable increments. Prefer the existing stack and small, justified changes. Do not introduce a separate search service, Redis, a new authentication provider, or a broad framework upgrade without evidence that it is necessary. Consult official documentation for the actual installed versions when deciding framework behavior or dependency compatibility.

## 1. Establish the baseline

- Trace the real UI-to-API-to-database flows for search, module details, review creation/edit/deletion, helpful votes, and login. Distinguish active code from unused alternatives.
- Inspect package manifests, both lockfiles, runtime requirements, Prisma schema and migrations, environment loading, imports, and deployment artifacts. Select and document one package manager after inspecting existing usage; do not regenerate lockfiles casually.
- Run a reproducible dependency installation and the existing lint, typecheck, formatting check, Prisma generation/validation, and production build. Record failures before fixing them. Check the separate import-script TypeScript project too.
- Produce `docs/PRODUCTION_AUDIT.md` with prioritized findings, file references, evidence, impact, proposed fixes, and verification. Label confirmed defects, suspected risks, and untested assumptions separately.
- Do not read or print secret values. Use an isolated disposable PostgreSQL database and synthetic data for tests and benchmarks. If external credentials or infrastructure are unavailable, keep working on everything independent and identify exactly which checks remain blocked.

## 2. Fix search correctness and performance

Start with these findings, verifying each:

- `app/api/search/modules/route.ts` implements case-insensitive substring matching with `take: 10`, no explicit ordering, and does not call `lib/modules/search-modules.ts`. Optimizing only the latter will not improve the active search path.
- The unused SQL search aggregates reviews across the catalog before selecting candidates. Its final `DISTINCT ON (id)` query orders by ID and applies a limit before JavaScript sorts by rank, so it can discard the most relevant results. Its prefix branch also limits without deterministic ordering.
- That SQL constructs English full-text vectors during requests. The existing migration adds trigram indexes, but no matching full-text expression index. Investigate German and English module names and actual catalog identifiers before choosing normalization and dictionaries.
- Raw aggregate results need explicit runtime serialization: PostgreSQL `COUNT` and decimal aggregates must not be assumed to match TypeScript `number` annotations.
- `hooks/use-search-modules.ts` already debounces and aborts requests. An obsolete request can still run its `finally` and clear the newer request's loading state. Check stale results, errors, clear behavior, unmounts, and overlapping completions as well.

Implement one canonical server-side search path and response contract. Keep client payloads small; fetch review aggregates only if actually displayed. Rank exact module codes first, followed by code/name prefixes, useful word or substring matches, then typo-tolerant matches. Use a deterministic tie-breaker and rank/deduplicate before the final limit. Preserve useful results for modules with no reviews.

Use PostgreSQL capabilities already available where appropriate. Validate candidate query shapes and matching indexes with `EXPLAIN (ANALYZE, BUFFERS)` on representative synthetic data. Do not claim that every query must use an index: short terms and small tables can favor sequential scans. Do not compute fuzzy distances over the entire catalog in the browser or load all modules to filter them there. Escape SQL wildcard characters when literal search is intended; retain parameterized SQL throughout.

Handle empty, one-character, long, whitespace-only, mixed-case, multiword, punctuated code, umlaut, accent, typo, and no-match queries deliberately. Bound query length and work, and ensure any fallback preserves a useful contract and reports degraded operation without hiding persistent failures. Fix stale request/loading behavior. Add caching only if measurements justify it, with explicit size/TTL limits and freshness rules. Check keyboard use, input labeling, empty/loading/error states, and mobile behavior.

Add a reproducible benchmark with dataset generation, queries, concurrency, warm-up, sample count, latency percentiles, error rates, query plans, and environment details. Compare baseline and changed implementations on the same data and environment. Use the bundled catalog as a representative starting point and test a larger growth scenario, such as 10,000 modules and 100,000 reviews. Suggested initial target: warm search API p95 below 200 ms at 20 concurrent clients on documented hardware, excluding deliberate client debounce. Treat this as a proposed budget, report observed results honestly, and explain any justified revision. If PostgreSQL cannot run, provide the harness and mark measurements unverified.

## 3. Close security and data-integrity gaps

- Public GET handlers in `app/api/modules/[moduleNumber]/reviews/route.ts` and `app/api/reviews/[reviewId]/route.ts` select and return author emails. Remove private fields from public contracts and verify all other responses for unnecessary personal data.
- Review API POST/PUT paths accept fields without the Zod validation and submission limits used by `app/actions/reviews.ts`. Route all mutation entry points through consistent domain validation, authorization, normalization, and rate-limit rules while preserving endpoint-specific create/update semantics.
- Fix whitespace-only summaries: the current schema checks length before trimming. Validate finite half-star ratings, text limits, referenced module/semester existence, and any confirmed semester eligibility rules. Return useful 400/401/403/404/409/429 responses rather than treating expected failures as generic 500 errors.
- Submission limits currently count stored reviews before creating a review. Assess concurrency and deletion bypasses; make abuse controls effective across multiple instances and concurrent requests without adding unnecessary infrastructure. Apply proportionate protections to expensive public reads and helpful-vote writes as well.
- `lib/search/highlight.ts` inserts catalog text into HTML without escaping, and search items render it with `dangerouslySetInnerHTML`. Prefer React text nodes and mark elements. `components/reviews/markdown-preview.tsx` interpolates link URLs into HTML attributes after escaping only `&`, `<`, and `>`; verify quote-based attribute injection and replace unsafe rendering with a maintained safe renderer or an equivalently defensible solution. Add meaningful regression coverage for malicious imported names and review content.
- Review helpful toggles for concurrent unique/delete conflicts and consistent returned counts. Review ownership checks, write atomicity, mutation error boundaries, malformed JSON, and body limits. Derive trusted identity from the session.
- Audit OAuth secrets, middleware versus server configuration, callback redirects, trusted hosts, cookies, request-origin/CSRF protections, and production environment validation. Never allow development secrets or a validation bypass to make an insecure production setup appear healthy. Preserve the existing edge-safe authentication separation where required.

## 4. Bound reads and maintain consistent results

- `app/api/modules/popular/route.ts` loads all modules and sorts them in JavaScript. Perform bounded ordering/aggregation in PostgreSQL with deterministic ties and a defined zero-review behavior.
- `lib/modules/get-module-page.ts` loads every review and every helpful voter's ID, then computes aggregates in JavaScript. The review API and personal review list also load unbounded lists. Introduce bounded server-side pagination and filtering, database aggregates, vote counts, and only the current user's vote state. Keep full-module statistics independent of the displayed review page.
- `app/api/modules/[moduleNumber]/stats/route.ts` also reads reviews for aggregate work; inspect and consolidate duplicated calculations.
- Ensure review sorting, semester filters, pagination ties, and helpful-vote state stay correct. Preserve existing UI behavior while updating clients for any intentional response changes.
- Correct route identifiers and refresh behavior. Helpful votes currently revalidate `/modules/${moduleId}` although the page route uses `moduleNumber`; review actions omit module/homepage refreshes. Invalidate affected old and new modules when a review moves, and keep counts, rankings, and charts current.
- Distinguish request-scoped React `cache` from persistent/shared caching. Never share personalized vote/session data through a public cache.
- Review the recent-modules endpoint's ID-based recency assumption. Define recency and, if needed, add a real timestamp with an honest backfill policy.
- Add composite indexes only when supported by actual query/filter/sort patterns and query plans. Preserve migration history and use additive migrations for existing installations.

## 5. Prepare reproducible deployment

- Verify compatible Node, Next.js, React, Prisma, Auth.js, TypeScript, and ESLint versions. The README recommends Node 18+ and the manifest mixes Next 15 with an ESLint config from Next 16; establish compatibility from installed package requirements and official docs rather than assuming either works or fails.
- Make clean installs and builds reproducible with a pinned supported runtime, one lockfile, explicit Prisma generation, and strict checks. Do not suppress errors to make CI pass.
- Reconcile environment loading: the README uses `.env.local`, while `prisma.config.ts` imports `dotenv/config`. Document and verify how application, migration, and import commands obtain configuration.
- Add a production migration command using `prisma migrate deploy`; reserve `migrate dev` for development. Verify fresh-database migration and upgrade paths in disposable databases, including `pg_trgm` availability and permissions. Do not reset databases or modify applied migrations.
- Choose and document one concrete deployment path suited to the repository. If the hosting target is unspecified, choose a reasonable default and state the assumption; add only the artifacts needed for that path. Document database pooling/connection limits, TLS, deployment environment variables, public OAuth callback URLs, build/runtime differences, and migration ordering.
- Add CI with clean install, Prisma generation, lint, typecheck, meaningful tests, and production build. Include disposable PostgreSQL integration tests where required and environment placeholders that cannot accidentally connect to production.
- Add suitable liveness/readiness checks, bounded database failures/timeouts, structured error logging without personal data or secrets, and a smoke-test procedure for a running production build.
- Review import tooling for idempotence, input validation, dry runs, error exit codes, cleanup, timeouts, and safe operation. Preserve module/review relationships and keep seeding/imports out of automatic production startup.
- Update README and `.env.example` with exact local and production commands, required versus optional variables, backup/restore guidance, migration failure recovery, application rollback limitations, and remaining operator setup.
- Check existing legal placeholders and analytics consent behavior as technical release requirements. List owner-provided legal identity, domain, OAuth credentials, and hosting configuration as operator tasks; do not invent them or claim legal certification.

## 6. Verification and completion

Add targeted tests for demonstrated defects and critical boundaries: search ranking and literal wildcards; deterministic limits; multilingual and typo queries; malicious highlighting/Markdown; overlapping client requests; review validation and cross-user permissions through every entry point; public response privacy; duplicate and concurrent writes; pagination and aggregate consistency; cache invalidation; and production configuration failures. Use integration tests against PostgreSQL for behavior mocks cannot validate. Include a small end-to-end suite for search-to-module navigation and the review lifecycle, with isolated test authentication if live Google OAuth is unavailable.

Run the checks appropriate to the final changes and report actual outcomes. Do not call the app deployment-ready solely because compilation passes. Update `docs/PRODUCTION_AUDIT.md` and add a deployment runbook plus search benchmark instructions/results. End with implemented changes, checks and measurements, unresolved issues, and exact operator steps. Clearly distinguish verified local readiness from infrastructure or OAuth checks that still need real credentials.

Proceed autonomously with reversible local fixes. Do not publish, deploy, purchase services, expose credentials, or mutate production databases as part of this task. If an external dependency blocks one step, complete the independent work and report the blocker precisely. Preserve unrelated user changes and existing data.
