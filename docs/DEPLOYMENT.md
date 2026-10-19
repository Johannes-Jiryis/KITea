# Deployment runbook

## Target and prerequisites

This runbook covers self-hosted Linux Docker, HTTPS ingress and managed PostgreSQL 17 (other supported PostgreSQL versions require environment-specific verification). For Vercel, use [the Vercel guide](VERCEL_DEPLOYMENT.md). Docker image runtime is pinned to the Node patch in `.nvmrc`. Review image and dependency patches regularly; a fixed patch is reproducible, not permanently secure.

The local verification host has no Docker installation. Container image build, managed-database TLS, live Google OAuth and public ingress must be verified in staging. CI executes on Linux, but a workflow being committed is not evidence it has run remotely.

Use separate database roles: a migration role permitted to create tables/indexes and install `pg_trgm`, and a runtime role granted only schema usage and required table SELECT/INSERT/UPDATE/DELETE privileges. Install the extension through the database administrator if managed hosting restricts it. Do not enable public database network access.

Use a provider-supported TLS connection string with certificate validation. Never set `rejectUnauthorized: false` or disable TLS verification to make deployment pass. Set the database/session timezone to UTC. Application and maintained import connections also request UTC.

## Build-time and runtime configuration

All `NEXT_PUBLIC_*` values are public, compiled into the app, and require rebuilding to change. The application has no analytics integration or legal placeholder pages.

Create `deploy.public.env` outside the image context containing only the public settings, not database/OAuth/session credentials. Pass it as a BuildKit secret to the build. Delete or securely manage this file according to your deployment system. The Docker build uses an unreachable database placeholder for Prisma generation.

Runtime environment must contain:

- `DATABASE_URL`: runtime database credentials and verified TLS.
- `NEXTAUTH_URL=https://your-real-host`: canonical HTTPS origin.
- `NEXTAUTH_SECRET`: unique randomly generated secret, at least 32 characters.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: real OAuth client credentials.
- `TRUST_PROXY=false` by default. See ingress requirements below.
- `NODE_ENV=production` (already set in the runtime image).

Use your deployment secret manager. Do not pass runtime secrets as build arguments, commit environment files, or bake them into an image. Generate a secret with `openssl rand -base64 48`. The startup validator rejects missing production configuration, development secrets, HTTP canonical URLs and `SKIP_ENV_VALIDATION=true`.

Configure Google authorized JavaScript origin `https://your-real-host` and redirect URI `https://your-real-host/api/auth/callback/google`. Verify login/logout, callback error handling, a fresh session, an expired session, and protected routes in staging.

## Build, migrate, then start

Run these commands only against the intended staging/production environment after backup verification. They are operational instructions; local tests never execute them automatically.

```sh
docker build --target runtime --secret id=public_env,src=/secure/deploy.public.env -t kitea:release .
docker build --target migrate --secret id=public_env,src=/secure/deploy.public.env -t kitea-migrate:release .
docker run --rm --env-file /secure/migration.env kitea-migrate:release
docker run -d --name kitea --restart unless-stopped --init --env-file /secure/runtime.env -p 127.0.0.1:3000:3000 kitea:release
```

The migration environment needs the migration-role DATABASE_URL. Keep the resulting migration image private; it contains build tooling, but no secret files. Runtime image runs as an unprivileged user and contains the Next standalone output, static assets and public assets.

Run migrations once as a release job before routing traffic to the new application. Never run `migrate dev`, `db push`, resets, import scripts or seeds as part of production startup. Existing migration files remain unchanged. The new migration retains reviews and marks historical module creation timestamps as unknown; new modules get real creation times. It backfills recent submission events to preserve existing limits.

The stored generated full-text vector and composite indexes use normal DDL. On a large live database they can block writes: measure migration time on a restored copy, schedule a maintenance window, or have the database operator prepare a reviewed concurrent-index migration plan before rollout. Do not edit a migration already applied to production. PostgreSQL maintains the vector on name changes; retain the SQL generated-column definition when reviewing future migrations. Monitor autovacuum and analyze after bulk imports; the recorded benchmark explicitly vacuums its synthetic data before steady-state measurement.

## Ingress, resource limits and health

Terminate TLS at the ingress, redirect HTTP to HTTPS and set HSTS after confirming domain readiness. Restrict accepted Host values to the canonical hostname, overwrite forwarded Host/Proto headers, and prevent direct public access to port 3000. Enable upstream request timeouts and a body limit around 40 KiB for mutation requests. Configure independent ingress rate limits so abuse cannot exhaust database connections before application throttles run.

Leave `TRUST_PROXY=false` unless your ingress overwrites `X-Real-IP` with a single validated client address and strips user-supplied values. With this flag enabled, database-backed public read limits are 180 requests/client/minute. Otherwise a shared 2400-requests/minute safety cap applies; this is not per-user identification. Set ingress budgets to your measured traffic needs. Keys are hashed; request logs do not include query bodies or credentials. Review IP-related retention with the operator.

Each self-hosted app instance has at most five PostgreSQL pool connections, a ten-second connection wait and five-second statement timeout. Budget `instances × 5` plus migration, monitoring and administration connections below the database limit. Vercel instances instead use one connection with a five-second idle timeout. Use a provider-supported pooler when scaling, and verify transaction/advisory/row-lock semantics with that pooler; do not assume every pooling mode is interchangeable. Review transactions serialize writes per user, then helpful votes per review.

Idle connections are retained for 60 seconds with TCP keepalive and a maximum lifetime of five minutes. Module and search reads retry once after a recognized connection failure, with a 200 ms delay. Query/statement timeouts, permission errors, and validation failures are not retried. A persistent module connection failure renders a temporary-unavailability screen with manual retry and a link back to search; metadata uses a safe fallback title. Unexpected programming errors still reach the error boundary. Writes are not retried automatically. After changing pool settings, restart `npm run dev` to replace the process-global Prisma client; hot reload alone retains the previous pool.

If local logs show `Connection terminated due to connection timeout`, verify the Supabase project is running and use the dashboard's session pooler URI for IPv4 networks. Do not reset migrations or disable TLS for a connectivity error. A local verification on 2026-10-19 initially reproduced intermittent timeouts even with the longer connection deadline; a subsequent run passed all 12 application search/module reads. This limited check does not establish sustained remote availability.

- `/api/health/live`: process can serve requests; does not depend on PostgreSQL.
- `/api/health/ready`: production configuration and migrated database are available. Returns 503 on failure, without internal error details.
- Docker healthcheck uses readiness; orchestrators should use liveness for restart decisions and readiness for routing decisions.
- Start with monitored CPU/memory limits, then load-test and tune using observed usage. The benchmark target is not a capacity promise for arbitrary hardware.

Run `npm run db:maintenance` daily from an operations job with database access. It deletes expired rate-limit rows and submission audit events older than 30 days; review deletion alone does not erase submission-limit history. Monitor maintenance failures and table growth. No review text, user records or module data are deleted by maintenance.

Private/personalized review responses are uncached. React cache only deduplicates server render work within a request. No shared personalized cache is introduced. Public module APIs are fetched fresh; client navigation refreshes after mutations. If adding CDN caching later, implement a cross-instance invalidation policy first.

## Release verification

1. Run the checks in README and review the audit and benchmark outputs.
2. Restore a representative backup into staging; verify migrations preserve data and measure index build time.
3. Check liveness/readiness, search queries, module navigation, review create/edit/delete, duplicate submissions, filters, pagination and helpful votes.
4. Check public review JSON contains no emails, other users' vote records, tokens or sessions.
5. Verify Google OAuth and forwarded-header handling through the real HTTPS ingress.
6. Verify the homepage opens directly to module search, with no cookie prompt, analytics requests, or links to removed information pages.
7. Exercise database unavailability and connection saturation; verify bounded failures and recovery.
8. Run the full search API load test through the target ingress, including TLS/network latency, and set alerts from observed p95/error rates.
9. Build/scan the actual Linux image, retain its digest, and confirm graceful shutdown/restart behavior. No public deployment has been performed by this task.

## Backups, failure recovery and rollback

Enable managed automated backups and point-in-time recovery before release. Periodically restore into an isolated database and verify record counts, reviews, sessions and sample module pages. Do not store database dumps in the repository.

Before a migration, verify a recent restorable backup and capture the current image digest and migration status. If deployment fails before migrations finish, keep old traffic serving, inspect `prisma migrate status` and migration logs, and determine what actually committed. Do not blindly retry partial DDL or mark a migration resolved. Use `prisma migrate resolve` only after the database operator has reconciled the failed state; document the correction.

An application rollback does not reverse schema migrations. The new tables, nullable timestamp and indexes are additive, so retaining them is usually safer than dropping them. Reverting to the old application would restore known privacy and validation defects; prefer a forward fix. If a data restore is required, coordinate downtime and account for writes after the backup. Never drop production tables merely to roll back code.
