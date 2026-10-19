import { getPrisma } from "../lib/prisma";
const main = async () => {
  if (
    process.env.TEST_DATABASE !== "true" ||
    !process.env.DATABASE_URL?.includes("127.0.0.1:55432/kitea_upgrade_test")
  )
    throw new Error("Upgrade verification requires the disposable upgrade database.");
  const prisma = getPrisma();
  try {
    if (process.argv[2] === "seed") {
      await prisma.user.create({
        data: { id: "upgrade-user", name: "Existing Student" },
        select: { id: true },
      });
      await prisma.semester.create({
        data: { id: "upgrade-semester", name: "Wintersemester", year: 2026 },
        select: { id: true },
      });
      // Seed the old table shape, before the generated client's new timestamp exists.
      await prisma.$executeRaw`INSERT INTO "Module" (id, "moduleNumber", "moduleName") VALUES ('upgrade-module', 'UP-101', 'Existing Module')`;
      await prisma.review.create({
        data: {
          id: "upgrade-review",
          userId: "upgrade-user",
          semesterTakenId: "upgrade-semester",
          moduleId: "upgrade-module",
          overallRating: 4.5,
          difficultyRating: 3,
          workloadRating: 2.5,
          summary: "Existing review preserved through upgrade.",
        },
        select: { id: true },
      });
      return;
    }
    const review = await prisma.review.findUniqueOrThrow({ where: { id: "upgrade-review" } });
    const existing = await prisma.module.findUniqueOrThrow({ where: { id: "upgrade-module" } });
    if (
      review.summary !== "Existing review preserved through upgrade." ||
      existing.createdAt !== null ||
      (await prisma.reviewSubmission.count()) !== 1
    )
      throw new Error("Migration did not preserve historical records or submission protection.");
    console.log(
      "Upgrade verified: existing reviews, unknown historical timestamps and durable submission backfill preserved.",
    );
  } finally {
    await prisma.$disconnect();
  }
};
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
