import { createServer } from "node:http";
import { once } from "node:events";
import { writeFile, mkdir } from "node:fs/promises";
import { cpus, platform, totalmem } from "node:os";
import { Prisma } from "@prisma/client";
import { getPrisma } from "../lib/prisma";
import { buildSearchQuery } from "../lib/search/query";
import { normalizeSearchQuery } from "../lib/search/normalize";
import { parseCsvFile } from "./lib/parsers/csv-parser";
import { GET as searchHandler } from "../app/api/search/modules/route";
import { NextRequest } from "next/server";
import { publicReadGuard } from "../lib/http/api";

const main = async () => {
  if (
    process.env.TEST_DATABASE !== "true" ||
    !process.env.DATABASE_URL?.includes("127.0.0.1:55432/kitea_test")
  )
    throw new Error("Benchmark requires the isolated test runner.");
  const prisma = getPrisma();
  const catalog = await parseCsvFile("data/modules-cleaned.csv");
  const queries = [
    "MA-101",
    "Analysis",
    "analysis",
    "Mathematik",
    "Analysiz",
    "H\u00f6here",
    "machine learning",
    "100%",
    "%_",
    "zzzzmissing",
    "CS",
    "   Analysis  ",
  ];
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (url.pathname === "/optimized") {
        const response = await searchHandler(
          new NextRequest(`http://localhost/api/search/modules${url.search}`),
        );
        res.writeHead(response.status, { "content-type": "application/json" });
        res.end(await response.text());
        return;
      }
      await publicReadGuard(new Request("http://localhost"));
      const query = url.searchParams.get("q")?.trim().slice(0, 80) || "";
      const results =
        query.length < 2
          ? []
          : await prisma.module.findMany({
              where: {
                OR: [
                  { moduleNumber: { contains: query, mode: "insensitive" } },
                  { moduleName: { contains: query, mode: "insensitive" } },
                ],
              },
              select: { id: true, moduleNumber: true, moduleName: true },
              take: 10,
            });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ results }));
    } catch {
      res.writeHead(503);
      res.end("{}");
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No benchmark port.");
  const url = `http://127.0.0.1:${address.port}`;
  const reports: unknown[] = [];
  try {
    for (const count of [Math.max(1, catalog.length), 10000]) {
      await prisma.$transaction(
        async (tx) => {
          await tx.$executeRaw`SET LOCAL statement_timeout = '90s'`;
          await tx.review.deleteMany();
          await tx.module.deleteMany();
          await tx.user.deleteMany();
          await tx.semester.deleteMany();
          const names = [...new Set(catalog.map((m) => m.moduleName))].slice(0, count);
          await tx.$executeRaw`
        INSERT INTO "Module" (id, "moduleNumber", "moduleName")
        SELECT 'bench-module-' || i, CASE WHEN i = 1 THEN 'MA-101' ELSE 'CS-' || lpad(i::text, 6, '0') END,
          (ARRAY[${Prisma.join(names)}]::text[])[1 + ((i-1) % ${names.length})] || CASE WHEN i % 5 = 0 THEN ' Analysis' ELSE '' END
        FROM generate_series(1, ${count}::int) i`;
          await tx.$executeRaw`INSERT INTO "User" (id) SELECT 'bench-user-' || i FROM generate_series(0, 9) i`;
          await tx.semester.create({
            data: { id: "bench-semester", name: "Wintersemester", year: 2026 },
          });
          await tx.$executeRaw`
        INSERT INTO "Review" (id, "userId", "moduleId", "semesterTakenId", "overallRating", "difficultyRating", "workloadRating", "updatedAt")
        SELECT 'bench-review-' || i, 'bench-user-' || ((i - 1) / ${count}::int),
          'bench-module-' || (1 + ((i - 1) % ${count}::int)), 'bench-semester', 4.5, 3, 2.5, now()
        FROM generate_series(1, ${count * 10}::int) i`;
          await tx.$executeRaw`ANALYZE "Module"`;
          await tx.$executeRaw`ANALYZE "Review"`;
        },
        { timeout: 120000 },
      );
      // Measure steady state after bulk import, including GIN pending-list cleanup.
      await prisma.$executeRaw`VACUUM (ANALYZE) "Module"`;
      await prisma.$executeRaw`VACUUM (ANALYZE) "Review"`;
      for (const mode of ["baseline", "optimized"]) {
        await prisma.requestLimit.deleteMany();
        const send = async (index: number) => {
          const started = performance.now();
          const response = await fetch(
            `${url}/${mode}?q=${encodeURIComponent(queries[index % queries.length])}`,
          );
          await response.text();
          return { duration: performance.now() - started, failed: !response.ok };
        };
        for (let index = 0; index < 60; index++) await send(index);
        const measurements: { duration: number; failed: boolean }[] = [];
        await Promise.all(
          Array.from({ length: 20 }, async (_, client) => {
            for (let index = 0; index < 50; index++)
              measurements.push(await send(client * 50 + index));
          }),
        );
        const sorted = measurements.map((m) => m.duration).sort((a, b) => a - b);
        const percentile = (p: number) =>
          Number(sorted[Math.ceil(sorted.length * p) - 1].toFixed(2));
        reports.push({
          mode,
          modules: count,
          reviews: count * 10,
          concurrency: 20,
          samples: sorted.length,
          warmup: 60,
          p50Ms: percentile(0.5),
          p95Ms: percentile(0.95),
          p99Ms: percentile(0.99),
          errors: measurements.filter((m) => m.failed).length,
        });
        console.log(JSON.stringify(reports[reports.length - 1]));
      }
      await mkdir("docs/search-plans", { recursive: true });
      for (const query of ["MA-101", "Analysis", "Mathematik", "CS"]) {
        const plan = await prisma.$queryRaw(
          Prisma.sql`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${buildSearchQuery(normalizeSearchQuery(query))}`,
        );
        await writeFile(
          `docs/search-plans/plan-${count}-${query}.json`,
          JSON.stringify(plan, null, 2),
        );
      }
    }
    const report = {
      at: new Date().toISOString(),
      node: process.version,
      platform: platform(),
      cpu: cpus()[0].model,
      logicalCpus: cpus().length,
      memoryGb: Number((totalmem() / 1024 ** 3).toFixed(1)),
      postgres: await prisma.$queryRaw`SELECT version()`,
      catalogRows: catalog.length,
      queries,
      scope:
        "Loopback HTTP harness invoking production search handler; baseline reproduces original Prisma query. Includes database read limiter; excludes Next middleware/routing, TLS, WAN and client debounce.",
      reports,
    };
    await writeFile("docs/SEARCH_BENCHMARK_RESULTS.json", JSON.stringify(report, null, 2) + "\n");
    console.log(JSON.stringify(report, null, 2));
  } finally {
    server.close();
    server.closeAllConnections();
    await prisma.$disconnect();
  }
};
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
