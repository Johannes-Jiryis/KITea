import "./load-env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import { createScriptPrisma } from "./lib/prisma";
import { handbookLinks } from "./lib/handbook-links";
import { consolidateCatalog } from "./lib/consolidate-catalog";

const main = async () => {
  const prisma = createScriptPrisma();
  const apply = process.argv.includes("--apply");
  try {
    const approvedIndex = process.argv.indexOf("--approved-pairs");
    const approvedPairs =
      approvedIndex < 0
        ? undefined
        : z
            .array(
              z
                .object({
                  courseNumber: z.string().regex(/^\d{7}$/),
                  moduleNumber: z.string().regex(/^M-[A-Z]+-\d+$/),
                })
                .strict(),
            )
            .parse(JSON.parse(await readFile(process.argv[approvedIndex + 1], "utf8")));
    await mkdir(".work", { recursive: true });
    const backup = `.work/catalog-consolidation-backup-${Date.now()}.json`;
    const report = await consolidateCatalog(prisma, handbookLinks, {
      apply,
      approvedPairs,
      backup: (records) => writeFile(backup, JSON.stringify(records, null, 2), { flag: "wx" }),
    });
    await writeFile(".work/catalog-consolidation-report.json", JSON.stringify(report, null, 2));
    console.log(
      JSON.stringify({
        apply,
        aliases: report.aliases,
        movedReviews: report.movedReviews,
        conflicts: report.conflicts.length,
        ambiguous: report.ambiguous.length,
        unmatched: report.unmatched.length,
        missing: report.missing.length,
        outsideApproval: report.outsideApproval.length,
        ...(apply && report.aliases ? { backup } : {}),
      }),
    );
    if (report.conflicts.length) process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
};
main().catch(() => {
  console.error(
    "Catalog consolidation failed. No credentials logged; transaction changes were rolled back. Check the database and retained backup.",
  );
  process.exitCode = 1;
});
