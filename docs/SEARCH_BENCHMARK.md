# Search benchmark

Run `npm run benchmark:search`. It starts a fresh loopback PostgreSQL 17 cluster, applies committed migrations, generates data, measures both implementations and stops the cluster. It never accepts an external database URL. Retained query plans are under `docs/search-plans/`; the summarized environment and results are written to `docs/SEARCH_BENCHMARK_RESULTS.json`.

Two datasets use names from the bundled cleaned catalog: catalog-sized, then 10,000 modules/100,000 synthetic reviews. Each mode has 60 warm-up requests followed by 1,000 samples across 20 concurrent clients. Queries cover exact codes, prefixes, German names, mixed case, multiword matches, typos, literal wildcards and missing results. Review data must not influence search query cost because autocomplete does not display ratings.

Baseline reproduces the original active Prisma substring query. Optimized mode invokes the production search route handler through the same loopback HTTP harness. Both include the current database-backed read limiter and JSON serialization. Results are not identical contracts for relevance: the baseline returns arbitrary first matches; optimized ranking deliberately does more useful work.

This measures the handler and database, excluding Next middleware/routing, TLS, network distance, cold starts and client debounce. The proposed warm p95 budget is 200 ms at concurrency 20; passing this harness is preliminary evidence, not verification through production ingress. Do not describe a latency improvement unless the recorded numbers support it. Review query plans for selective and broad queries; small tables or two-character terms can legitimately use sequential scans.

The stored `simple` full-text vector and its GIN index support German and English words without applying an English-only stemmer. PostgreSQL updates the vector automatically on name changes. Existing trigram indexes support literal substring and similarity candidates. Exact-code equality is case-insensitive. Diacritics are retained; the app does not promise accent transliteration. Similarity scores are computed only for fuzzy candidates, and fuzzy work is skipped when ten literal/word matches already exist. No cache or external search service is required for correctness.

Record measurements only from completed runs. Actual deployment load testing remains a release gate in the deployment runbook.

## Recorded local results

2026-10-19, PostgreSQL 17.6, Node 22.14.0, Windows, Ryzen 7 5700U, 16 logical CPUs, 15.3 GiB RAM. Data generation is followed by VACUUM ANALYZE to measure steady-state index behavior after bulk import. Full environment and parameters are in the JSON report.

| Modules / reviews | Original unordered search p95 | Final ranked search p95 | Errors             |
| ----------------- | ----------------------------- | ----------------------- | ------------------ |
| 3,124 / 31,240    | 69.50 ms                      | 109.84 ms               | 0 / 1,000 per mode |
| 10,000 / 100,000  | 74.15 ms                      | 107.51 ms               | 0 / 1,000 per mode |

The final ranked handler meets the proposed 200 ms local budget. It is slower than the original simpler unordered query, and provides exact/prefix/word/typo ranking that the original does not. Do not describe these numbers as a speedup over the original API. An intermediate ranked query measured 242 ms p95 at the larger size; removing similarity scoring for already-valid literal matches reduced that overhead. Without post-import vacuum, GIN pending-list costs also increased latency; production autovacuum health matters.

Final 10,000-module query plans: exact code 0.69 ms using bitmap scans over the trigram/full-text indexes; Analysis 22.21 ms, broad two-character CS 23.35 ms and Mathematik 17.04 ms. Broad predicates legitimately use table scans. Handler p95 includes contention, rate limiting and JSON transport in addition to query execution.
