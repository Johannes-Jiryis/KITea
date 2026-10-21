# Supabase Security Advisor hardening

On 21 October 2026, migration `20261021000000_security_advisor_hardening` addressed the five warnings reported for this project. The migration was tested on disposable PostgreSQL, previewed on the connected Supabase database inside a rolled-back transaction, then applied there as requested by the owner. It changes no module, review, account or vote records.

## Changes

| Reported warning                                 | Change                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Mutable search path on `enforce_module_alias()`  | Empty fixed search path, schema-qualified references to `public` tables, and explicit `SECURITY INVOKER`.                                     |
| Mutable search path on `resolve_review_module()` | Same hardening, preserving automatic review resolution to parent modules.                                                                     |
| `pg_trgm` in `public`                            | Relocated to `extensions` using `ALTER EXTENSION ... SET SCHEMA`. The extension was not dropped or upgraded and its indexes were not rebuilt. |
| Anonymous execution of `rls_auto_enable()`       | Removed execution grants from `PUBLIC` and `anon`.                                                                                            |
| Authenticated execution of `rls_auto_enable()`   | Removed execution grants from `authenticated`.                                                                                                |

The inspected `rls_auto_enable()` returns `event_trigger`; it is an internal DDL hook rather than an ordinary application RPC. Its body, owner, fixed `pg_catalog` search path, and attached `ensure_rls` event trigger remain unchanged. Existing service-role execution access is preserved. The two application trigger functions also no longer grant direct execution to public API roles. No global default privileges or unrelated functions were changed.

The application explicitly calls `extensions.similarity()` and `OPERATOR(extensions.%)`, so fuzzy search does not depend on the caller's search path. Prisma's trigram operator classes are schema-qualified too. Before migration, the deployed Supabase role's path already included `extensions`; this kept the preceding app revision working while the new revision was built.

## Verification

- Fresh migration, repeated migration, and upgrade from the original schema passed on disposable PostgreSQL.
- All 26 PostgreSQL integration tests passed, including anonymous/authenticated execution checks, unchanged automatic-RLS fixture behavior, valid extension indexes, typo search without `extensions` on the session path, and review/alias triggers with shadowing temporary tables.
- Live catalog checks confirmed both application functions have fixed search paths and all three functions deny execution to `anon` and `authenticated`.
- Live checks confirmed the provider event trigger definition, owner, and enabled event triggers were preserved; service-role access remains available.
- Both live trigram index OIDs and validity flags were preserved. No rebuild occurred.
- Live counts remained 5,333 modules, two reviews, and zero helpful votes; typo search still returned results.

Pre-change function definitions, permissions, extension details, and index identities are saved privately in ignored `.work/security-advisor-before.json` and `.work/security-advisor-extra-before.json`. Post-change checks are in `.work/security-advisor-after.json`. These are local recovery evidence, not a substitute for provider backups.

Refresh **Supabase → Security Advisor** after deployment to recalculate its warnings. These checks resolve the five reported conditions; they are not a certification that every possible database security issue has been eliminated.

## Reproduce and deploy

Run `npm run test:integration`, `npm run check`, and the production build using the documented test/build environment. The integration runner creates provider-like roles and an automatic-RLS event trigger only in its disposable database; it never loads production settings for that fixture.

Apply committed migrations with `npm run db:deploy` using the migration connection, then deploy the matching application revision. Do not edit an applied migration, drop `pg_trgm`, rebuild its indexes unnecessarily, or disable RLS/event triggers. A restricted runtime role needs `USAGE` on `extensions` and execution access to the needed extension functions; it does not need schema creation rights. The current Supabase runtime/migration role was verified before application.

The migration is transactional and uses bounded lock/statement timeouts. Supabase's managed-extension support permitted relocation despite the extension being owned by `supabase_admin`; this was established by the rollback-only preview, not by changing ownership or granting administrator membership. On another installation, inspect privileges before applying. A permissions failure should be resolved through the provider-supported extension management path rather than by modifying system catalogs.

Keep the hardening migration when rolling back application code. Older unqualified search queries need the verified `extensions` search path; current queries use explicit qualification. If a migration fails, inspect whether its transaction rolled back and follow the existing migration recovery runbook rather than resetting the database. Restore function bodies or privileges only through a reviewed additive migration; do not reopen anonymous execution simply to work around an unrelated application error.

Sources: [Supabase function security](https://supabase.com/docs/guides/database/functions), [PostgreSQL extension relocation](https://www.postgresql.org/docs/17/sql-alterextension.html), [Supabase managed extension relocation test](https://github.com/supabase/supautils/blob/master/test/sql/privileged_extensions.sql).
