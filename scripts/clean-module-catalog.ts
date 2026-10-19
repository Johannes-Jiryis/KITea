import "./load-env";
import { mkdir, writeFile } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { createScriptPrisma } from "./lib/prisma";
import { moduleTitleIssue } from "./lib/module-title";

async function main() {
  const apply = process.argv.includes("--apply");
  const prisma = createScriptPrisma();
  try {
    const rows = await prisma.module.findMany({
      select: {
        id: true,
        moduleNumber: true,
        moduleName: true,
        description: true,
        semesters: { select: { id: true } },
        _count: { select: { reviews: true } },
      },
    });
    const candidates = rows.filter((row) => moduleTitleIssue(row.moduleName));
    const protectedRows = candidates.filter(
      (row) => row._count.reviews > 0 || /^M-/.test(row.moduleNumber),
    );
    const removable = candidates.filter((row) => !protectedRows.includes(row));
    console.log(
      JSON.stringify({
        apply,
        candidates: candidates.length,
        removable: removable.length,
        protected: protectedRows.length,
      }),
    );
    if (!apply || !removable.length) return;
    await mkdir(".work", { recursive: true });
    const backup = `.work/removed-catalog-metadata-${Date.now()}.json`;
    await writeFile(
      backup,
      JSON.stringify({ capturedAt: new Date().toISOString(), modules: removable }, null, 2),
      { flag: "wx" },
    );
    const deleted = await prisma.$transaction(
      async (tx) => {
        // Lock the modules to block new review references while checking and deleting.
        await tx.$queryRaw`SELECT id FROM "Module" WHERE id IN (${Prisma.join(removable.map((row) => row.id))}) FOR UPDATE`;
        const result = await tx.module.deleteMany({
          where: {
            OR: removable.map((row) => ({ id: row.id, moduleName: row.moduleName })),
            reviews: { none: {} },
          },
        });
        if (result.count !== removable.length)
          throw new Error("Catalog changed during cleanup; transaction rolled back");
        return result.count;
      },
      { timeout: 30000 },
    );
    const remaining = await prisma.module.count({
      where: { id: { in: removable.map((row) => row.id) } },
    });
    console.log(JSON.stringify({ deleted, remaining, backup }));
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Catalog cleanup failed; no credentials logged. Check connection and retained backup.",
  );
  process.exitCode = 1;
});
