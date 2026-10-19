# Module page latency check

Measured locally on 2026-10-20 after a reported development request to `/modules/2400258` took 5,141 ms, including a reported 1,597 ms compilation. The remainder cannot be attributed entirely to PostgreSQL from that log alone.

## Changes

- Share a request-scoped React `cache` lookup between page metadata and module content. Personalized review/vote data is not stored in a shared cache.
- Fetch review counts, averages, and the rating histogram in one PostgreSQL statement with one snapshot and a bounded set of rating buckets.
- Fetch a bounded review page, its total, semester labels, helpful counts, and the viewer's vote/ownership flags in one parameterized PostgreSQL statement. Empty/out-of-range pages retain their total. Sorting uses an explicit allowlist and ID tie-breaker. Author identity stays private.
- Retry only the failed read, instead of repeating all module statistics/review reads together. Writes are not retried.

Single-statement reads replace the previous multi-statement read transactions, including their BEGIN/isolation/COMMIT round trips. No schema migration or persistent result cache was added.

## Observations

The same local diagnostic performed two explicit module lookups, then concurrent statistics and review reads, against the configured remote Supabase session pooler. Both runs used module `2400258`, Node 22.14, and the installed Prisma 7.10.1 adapter. It did not mutate data or include OAuth, Next.js rendering, or compilation. React request memoization is inactive outside a React render, so the diagnostic deliberately retains both lookups in each run; it does not measure the additional lookup-sharing benefit in Next.js.

| Run     | Before total | After total | Before stats | After stats | Before reviews | After reviews |
| ------- | ------------ | ----------- | ------------ | ----------- | -------------- | ------------- |
| Initial | 1,596 ms     | 1,109 ms    | 349 ms       | 71 ms       | 718 ms         | 332 ms        |
| Warm 1  | 647 ms       | 359 ms      | 274 ms       | 112 ms      | 397 ms         | 113 ms        |
| Warm 2  | 687 ms       | 348 ms      | 297 ms       | 97 ms       | 444 ms         | 97 ms         |
| Warm 3  | 764 ms       | 400 ms      | 382 ms       | 88 ms       | 491 ms         | 81 ms         |

Three subsequent HTTP GET requests to the running local development server returned 200, with no unavailability fallback: **1,573 ms**, **495 ms**, and **558 ms**. These requests were signed out. They include reading the response body and local server rendering; the first may include development recompilation. No comparable pre-change HTTP run was collected, so the user's earlier 5,141 ms log is not a controlled HTTP baseline.

These are small diagnostic samples, not a percentile benchmark or production SLA. Network conditions, compilation, machine load, authentication, and connection warm-up can change the result. For a quick local check, keep `npm run dev` running, stop editing files, revisit the same module several times, and compare the server's GET timings after compilation settles. Production build performance must be measured separately.

## Verification

PostgreSQL integration coverage checks empty and out-of-range pages, all five sorts and deterministic ties, semester filtering, half-star weighted averages, timestamps, helpful counts, viewer vote state, and anonymous ownership flags. Existing account/review permission checks remain in place.

Final checks passed: 51 unit tests, 16 disposable PostgreSQL integration tests, the Chromium review/account lifecycle, lint, and typecheck. The browser test used port 3101 and isolated build output; the observed HTTP timings above came from the existing server on port 3000.

Request-scoped lookup sharing follows [Next.js metadata memoization guidance](https://nextjs.org/docs/app/api-reference/functions/generate-metadata). Raw statements use the installed client's [parameterized SQL helpers](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries).
