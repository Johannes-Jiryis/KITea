import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
vi.mock("@/auth", () => ({ auth: async () => null }));
import { getPrisma } from "@/lib/prisma";
import { consolidateCatalog } from "@/scripts/lib/consolidate-catalog";
import { getModuleByNumber } from "@/lib/modules/get-module";
import { searchModules } from "@/lib/modules/search-modules";
import { saveReview } from "@/lib/reviews/service";
import { getModuleStats } from "@/lib/modules/stats";
import { importModules } from "@/scripts/lib/importer";
import { Logger } from "@/scripts/lib/logger";
import { handbookLinks } from "@/scripts/lib/handbook-links";
import { GET as reviewGet } from "@/app/api/modules/[moduleNumber]/reviews/route";
import { GET as statsGet } from "@/app/api/modules/[moduleNumber]/stats/route";

const prisma = getPrisma();
const links = [
  { courseNumber: "2400008", moduleNumbers: ["M-INFO-106959"], pages: [799] },
  { courseNumber: "2400034", moduleNumbers: ["M-INFO-106959"], pages: [800] },
];
const values = {
  moduleId: "cat-lecture",
  semesterTakenId: "cat-semester",
  summary: "A sufficiently detailed module review.",
  overallRating: 4,
  difficultyRating: 3,
  workloadRating: 2,
};
beforeAll(() => {
  if (
    process.env.TEST_DATABASE !== "true" ||
    !process.env.DATABASE_URL?.includes("127.0.0.1:55432/kitea_test")
  )
    throw new Error("Only use the isolated test database.");
});
const cleanup = async () => {
  await prisma.reviewHelpful.deleteMany();
  await prisma.review.deleteMany();
  await prisma.reviewSubmission.deleteMany();
  await prisma.requestLimit.deleteMany();
  await prisma.module.deleteMany({ where: { canonicalModuleId: { not: null } } });
  await prisma.module.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.user.deleteMany();
};
beforeEach(async () => {
  await cleanup();
  await prisma.user.createMany({ data: [{ id: "cat-u1" }, { id: "cat-u2" }, { id: "cat-u3" }] });
  await prisma.semester.createMany({
    data: [
      { id: "cat-semester", name: "Wintersemester", year: 2026 },
      { id: "cat-old-semester", name: "Sommersemester", year: 2026 },
    ],
  });
  await prisma.module.createMany({
    data: [
      {
        id: "cat-parent",
        moduleNumber: "M-INFO-106959",
        moduleName: "Machine Learning for Natural Sciences",
      },
      {
        id: "cat-lecture",
        moduleNumber: "2400008",
        moduleName: "Machine Learning for the Natural Sciences",
      },
      {
        id: "cat-exercise",
        moduleNumber: "2400034",
        moduleName: "Exercise for Machine Learning for the Natural Sciences",
      },
      { id: "cat-other", moduleNumber: "OTHER-1", moduleName: "Machine Learning for Robotics" },
    ],
  });
  await prisma.module.update({
    where: { id: "cat-lecture" },
    data: { semesters: { connect: { id: "cat-old-semester" } } },
  });
});
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

it("merges verified aliases without losing reviews/votes and resolves search, pages, APIs and writes", async () => {
  const first = await prisma.review.create({ data: { ...values, userId: "cat-u1" } });
  const second = await prisma.review.create({
    data: { ...values, moduleId: "cat-exercise", userId: "cat-u2" },
  });
  await prisma.reviewHelpful.create({ data: { reviewId: first.id, userId: "cat-u3" } });
  const backup = vi.fn(async () => {});
  const dry = await consolidateCatalog(prisma, links, { apply: false, backup });
  expect(dry).toMatchObject({ aliases: 2, movedReviews: 2, conflicts: [] });
  expect(backup).not.toHaveBeenCalled();
  expect((await prisma.review.findUniqueOrThrow({ where: { id: first.id } })).moduleId).toBe(
    "cat-lecture",
  );
  await consolidateCatalog(prisma, links, { apply: true, backup });
  expect(backup).toHaveBeenCalledOnce();
  expect(
    await prisma.review.count({
      where: { id: { in: [first.id, second.id] }, moduleId: "cat-parent" },
    }),
  ).toBe(2);
  expect(await prisma.reviewHelpful.count({ where: { reviewId: first.id } })).toBe(1);
  expect((await getModuleByNumber("2400034"))?.id).toBe("cat-parent");
  expect((await getModuleByNumber("cat-lecture"))?.semesters.map((s) => s.id)).toContain(
    "cat-old-semester",
  );
  expect((await searchModules("2400034"))[0]?.id).toBe("cat-parent");
  const results = await searchModules("Machine Learning");
  expect(results.filter((row) => row.id === "cat-parent")).toHaveLength(1);
  expect(results.some((row) => row.id === "cat-other")).toBe(true);
  expect(results.some((row) => row.id === "cat-exercise" || row.id === "cat-lecture")).toBe(false);
  expect((await getModuleStats("cat-parent")).reviewCount).toBe(2);
  const context = { params: Promise.resolve({ moduleNumber: "2400034" }) };
  const response = await reviewGet(
    new Request("http://localhost:3000/api/modules/2400034/reviews"),
    context,
  );
  expect(response.status).toBe(200);
  expect((await response.json()).total).toBe(2);
  expect(
    (
      await (
        await statsGet(new Request("http://localhost:3000/api/modules/2400034/stats"), context)
      ).json()
    ).totalReviews,
  ).toBe(2);
  const saved = await saveReview("cat-u3", values);
  expect(saved.review.moduleId).toBe("cat-parent");
  await expect(
    prisma.review.create({ data: { ...values, moduleId: "cat-exercise", userId: "cat-u1" } }),
  ).rejects.toMatchObject({ code: "P2002" });
  const again = await consolidateCatalog(prisma, links, { apply: true, backup });
  expect(again.aliases).toBe(0);
  expect(backup).toHaveBeenCalledOnce();
  const imported = await importModules(
    prisma,
    [
      {
        moduleNumber: "2400034",
        moduleName: "Exercise for Machine Learning for the Natural Sciences",
      },
    ],
    { semesterName: "Wintersemester", semesterYear: 2027, dryRun: false, verbose: false },
    new Logger(false),
  );
  expect(imported.stats.errors).toBe(0);
  expect((await getModuleByNumber("2400034"))?.semesters.some((s) => s.year === 2027)).toBe(true);
});

it("leaves entire groups unchanged for same-user same-semester review conflicts", async () => {
  await prisma.review.create({ data: { ...values, userId: "cat-u1" } });
  await prisma.review.create({ data: { ...values, moduleId: "cat-parent", userId: "cat-u1" } });
  const backup = vi.fn(async () => {});
  const report = await consolidateCatalog(prisma, links, { apply: true, backup });
  expect(report.conflicts).toEqual(["M-INFO-106959"]);
  expect(report.aliases).toBe(0);
  expect(await prisma.review.count()).toBe(2);
  expect(await prisma.module.count({ where: { canonicalModuleId: { not: null } } })).toBe(0);
});

it("does not guess a parent for shared courses and rolls back if backup fails", async () => {
  const report = await consolidateCatalog(
    prisma,
    [{ ...links[0], moduleNumbers: ["M-INFO-106959", "OTHER-1"] }],
    { apply: false },
  );
  expect(report.ambiguous).toEqual(["2400008"]);
  expect(report.aliases).toBe(0);
  await expect(
    consolidateCatalog(prisma, links, {
      apply: true,
      backup: async () => {
        throw new Error("disk full");
      },
    }),
  ).rejects.toThrow("disk full");
  expect(await prisma.module.count({ where: { canonicalModuleId: { not: null } } })).toBe(0);
});

it("rejects alias chains and unreviewed importer conversions", async () => {
  await expect(consolidateCatalog(prisma, links, { apply: true })).rejects.toThrow("backup");
  const imported = await importModules(
    prisma,
    [{ moduleNumber: "2400008", moduleName: "Machine Learning for the Natural Sciences" }],
    { semesterName: "Sommersemester", semesterYear: 2026, dryRun: false, verbose: false },
    new Logger(false),
  );
  expect(imported.stats.errors).toBe(1);
  await consolidateCatalog(prisma, links, { apply: true, backup: async () => {} });
  await expect(
    prisma.module.update({
      where: { id: "cat-other" },
      data: { canonicalModuleId: "cat-lecture" },
    }),
  ).rejects.toThrow();
  await expect(
    prisma.module.update({ where: { id: "cat-parent" }, data: { canonicalModuleId: "cat-other" } }),
  ).rejects.toThrow();
});

it("consolidates reused course numbers only for the matching title/semester and respects approval scope", async () => {
  await prisma.module.createMany({
    data: [
      {
        id: "cat-sampling",
        moduleNumber: "M-INFO-107090",
        moduleName: "Sampling Methods for Machine Learning",
      },
      { id: "cat-seminar", moduleNumber: "M-INFO-107436", moduleName: "Failing Forward: Robotics" },
    ],
  });
  await prisma.module.create({
    data: {
      id: "cat-reused",
      moduleNumber: "2400194",
      moduleName: "Sampling Methods for Machine Learning",
      semesters: { connect: { id: "cat-old-semester" } },
    },
  });
  const real = handbookLinks.filter((link) => link.courseNumber === "2400194");
  const excluded = await consolidateCatalog(prisma, real, { apply: false, approvedPairs: [] });
  expect(excluded.aliases).toBe(0);
  expect(excluded.outsideApproval).toEqual(["2400194"]);
  const report = await consolidateCatalog(prisma, real, {
    apply: true,
    backup: async () => {},
    approvedPairs: [{ courseNumber: "2400194", moduleNumber: "M-INFO-107090" }],
  });
  expect(report.aliases).toBe(1);
  expect((await getModuleByNumber("2400194"))?.id).toBe("cat-sampling");
  const imported = await importModules(
    prisma,
    [
      {
        moduleNumber: "2400194",
        moduleName:
          "Failing Forward: Robotics, Critical Reading and the Making of Good Research - Seminar",
      },
    ],
    { semesterName: "Wintersemester", semesterYear: 2026, dryRun: false, verbose: false },
    new Logger(false),
  );
  expect(imported.stats.errors).toBe(1);
  expect((await getModuleByNumber("2400194"))?.id).toBe("cat-sampling");
});

it("imports new parent/alias pairs atomically and previews the same batch without creating records", async () => {
  const records = [
    { moduleNumber: "2400194", moduleName: "Sampling Methods for Machine Learning" },
    { moduleNumber: "M-INFO-107090", moduleName: "Sampling Methods for Machine Learning" },
  ];
  const options = {
    semesterName: "Sommersemester" as const,
    semesterYear: 2026,
    dryRun: true,
    verbose: false,
  };
  const dry = await importModules(prisma, records, options, new Logger(false));
  expect(dry.stats).toMatchObject({ created: 2, errors: 0 });
  expect(
    await prisma.module.count({
      where: { moduleNumber: { in: records.map((r) => r.moduleNumber) } },
    }),
  ).toBe(0);
  const actual = await importModules(
    prisma,
    records,
    { ...options, dryRun: false },
    new Logger(false),
  );
  expect(actual.stats).toMatchObject({ created: 2, errors: 0 });
  const alias = await prisma.module.findUniqueOrThrow({
    where: { moduleNumber: "2400194" },
    include: { canonicalModule: { include: { semesters: true } } },
  });
  expect(alias.canonicalModule?.moduleNumber).toBe("M-INFO-107090");
  expect(
    alias.canonicalModule?.semesters.some(
      (term) => term.name === "Sommersemester" && term.year === 2026,
    ),
  ).toBe(true);
});
