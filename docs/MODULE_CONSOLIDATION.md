# Consolidating module review pages

The September 2026 Informatik Master handbook lists modules (`M-*`), assessment components (`T-*`), and teaching events (numeric identifiers). Lectures and exercises with one confirmed parent now act as searchable aliases for that parent, which holds all reviews. Teaching-event numbers can be reused, so a mapping also requires the matching title and semester. Shared, translated, or unmatched historical entries remain separate; the script never selects an arbitrary parent.

## Evidence and scope

See [the verified mapping and excluded shared courses](MODULE_CONSOLIDATION_REVIEW.md). `data/handbook-course-links.json` records the PDF hash, date, and page references. It contains explicit parent relationships, not title matches. The supplied PDF is not committed.

Regenerate the mapping with Python and `pypdf==6.21.1` installed in an isolated environment:

```powershell
python scripts/extract-handbook-links.py "C:\path\to\88-079-H-2023_v1_2026-09-10_de.pdf"
python -m unittest discover -s tests -p test_handbook_links.py
```

Review regenerated relationships before applying a newer handbook. This handbook does not prove relationships for every other department, year, or differently named legacy entry.

## Apply a reviewed consolidation

These commands change the database selected by the shell or local environment. Production application requires explicit operator approval. Back up the database first. Use the session pooler for migrations as described in [the Vercel guide](VERCEL_DEPLOYMENT.md).

```powershell
npm.cmd run prisma:generate
npm.cmd run db:deploy
npm.cmd run catalog:consolidate -- --approved-pairs data/module-consolidation-approved-2026-10-20.json
```

The default is a dry run. Inspect `.work/catalog-consolidation-report.json`. It lists proposed pairs, ambiguous shared courses, unmatched titles/semesters, missing parents, pairs outside approval, and conflicting review groups. `--approved-pairs` limits changes to the exact previously approved pairs. Omit it only when reviewing a new full scope. Apply only after reviewing that result:

```powershell
npm.cmd run catalog:consolidate -- --approved-pairs data/module-consolidation-approved-2026-10-20.json --apply
npm.cmd run catalog:consolidate -- --approved-pairs data/module-consolidation-approved-2026-10-20.json
```

Application takes short database table locks to prevent concurrent imports/reviews from changing the preflight result. Schedule it during low traffic. The transaction writes an exclusive, timestamped backup of affected modules, semester links, reviews, and helpful votes into `.work/catalog-consolidation-backup-*.json` before making changes. Failure to write the backup aborts the transaction. These files include internal user IDs/review content; keep them private and do not commit them. Use regular provider backups as well.

For safe groups, the command unions semester links, moves reviews without changing review IDs or votes, and sets `canonicalModuleId` on each legacy course. It deletes nothing. If one user reviewed multiple entries in the same group and semester, that entire group is skipped and reported for manual resolution. A successful repeated run proposes zero new aliases. A database trigger also canonicalizes review writes from older application instances; uniqueness still prevents duplicate reviews for a user/module/semester.

Deploy the matching application revision after the additive migration and consolidation. Search still matches course names/numbers but deduplicates parents before limiting results. Old page URLs redirect permanently, preserving query parameters. Review APIs, form options, and submissions resolve aliases to the parent. Maintained imports reuse aliases; unreviewed conversions of existing course records are rejected.

## Verification

```powershell
npm.cmd run check
python -m unittest discover -s tests -p test_handbook_links.py
npm.cmd run test:integration
npm.cmd run test:e2e
```

Integration tests use disposable PostgreSQL and cover preserved review/vote IDs, semester union, dry runs, repeated application, same-user conflicts, ambiguous parents, backup failure rollback, alias-chain rejection, imports, search deduplication, API reads, and canonical review writes. Browser coverage checks searching an exercise number, old-link redirects with query parameters, and seeing the resulting review on the shared page. Authentication uses an isolated JWT fixture, not live Google OAuth.

On the deployed application, search `2400008` and `2400034`; both should lead to `M-INFO-106959`. Search `2400194`; it should lead to `M-INFO-107090`. Searching `Machine Learning` should still offer other distinct modules. Confirm `/modules/2400034` redirects to the parent and that existing reviews remain visible.

## Recovery

The schema migration is additive. Keep the alias column and safeguards when rolling back application code; old code can otherwise recreate separate review targets. For a data correction, use the timestamped backup to identify affected aliases and original review IDs. In a reviewed transaction, clear only those alias pointers, restore only affected original review references and semester links, and verify unique constraints and counts. Reviews written after consolidation must be handled explicitly: their original course cannot be inferred. Do not blindly replay a backup over newer data, delete parent modules, reset the database, or edit an applied migration. Prefer correcting a mistaken mapping over splitting newly shared reviews.
