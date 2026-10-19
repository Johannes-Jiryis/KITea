import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const identity = vi.hoisted(() => ({ id: "" }));
const accountSignOut = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({
  auth: async () => (identity.id ? { user: { id: identity.id } } : null),
  signOut: accountSignOut,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { revalidatePath } from "next/cache";
import { getPrisma } from "@/lib/prisma";
import { saveReview, removeReview } from "@/lib/reviews/service";
import { searchModules } from "@/lib/modules/search-modules";
import { getModuleStats } from "@/lib/modules/stats";
import { getModuleReviews } from "@/lib/modules/reviews";
import { toggleReviewHelpful } from "@/app/actions/review-helpful";
import {
  createReview as actionCreate,
  updateReview as actionUpdate,
  deleteReview as actionDelete,
} from "@/app/actions/reviews";
import {
  GET as getReview,
  PUT as putReview,
  DELETE as deleteReview,
} from "@/app/api/reviews/[reviewId]/route";
import {
  GET as getReviews,
  POST as postReview,
} from "@/app/api/modules/[moduleNumber]/reviews/route";
import { publicReadGuard } from "@/lib/http/api";
import { importModules } from "@/scripts/lib/importer";
import { Logger } from "@/scripts/lib/logger";
import { deleteAccount } from "@/app/actions/account";
import { deleteOwnAccount } from "@/lib/accounts/delete-account";

const prisma = getPrisma();
const valid = {
  moduleId: "m1",
  semesterTakenId: "s1",
  summary: "This is a detailed and useful course review.",
  overallRating: 4.5,
  difficultyRating: 3,
  workloadRating: 2,
};
const context = (reviewId: string) => ({ params: Promise.resolve({ reviewId }) });
const moduleContext = () => ({ params: Promise.resolve({ moduleNumber: "MA-101" }) });
const request = (method: string, body?: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/reviews", {
    method,
    headers: { origin, "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

beforeAll(() => {
  if (
    process.env.TEST_DATABASE !== "true" ||
    !process.env.DATABASE_URL?.includes("127.0.0.1:55432/kitea_test")
  )
    throw new Error("Integration tests only run against the disposable test database.");
});
beforeEach(async () => {
  vi.clearAllMocks();
  identity.id = "u1";
  await prisma.reviewHelpful.deleteMany();
  await prisma.reviewSubmission.deleteMany();
  await prisma.review.deleteMany();
  await prisma.requestLimit.deleteMany();
  await prisma.module.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.createMany({
    data: [
      { id: "u1", name: "Author", email: "private-author@example.test" },
      { id: "u2", name: "Other", email: "private-other@example.test" },
    ],
  });
  await prisma.semester.create({ data: { id: "s1", name: "Wintersemester", year: 2026 } });
  await prisma.module.createMany({
    data: [
      { id: "m1", moduleNumber: "MA-101", moduleName: "Analysis" },
      { id: "m2", moduleNumber: "MA-1012", moduleName: "Analysis II" },
      { id: "m3", moduleNumber: "CS-1", moduleName: "Computing 100% _ advanced" },
      { id: "m4", moduleNumber: "DE-1", moduleName: "H\u00f6here Mathematik \u00dcbungen" },
    ],
  });
});
afterAll(async () => prisma.$disconnect());

describe("account deletion", () => {
  it("requires authentication and typed confirmation", async () => {
    identity.id = "";
    expect(await deleteAccount("DELETE")).toEqual({ error: "Sign in to delete your account." });
    identity.id = "u1";
    expect(await deleteAccount("delete")).toEqual({
      error: "Type DELETE to confirm account deletion.",
    });
    expect(await prisma.user.count()).toBe(2);
    expect(accountSignOut).not.toHaveBeenCalled();
  });

  it("deletes only the session user's data, cascades votes and sessions, and refreshes affected modules", async () => {
    const own = (await saveReview("u1", valid)).review;
    const other = (await saveReview("u2", { ...valid, moduleId: "m2" })).review;
    await prisma.reviewHelpful.createMany({
      data: [
        { userId: "u2", reviewId: own.id },
        { userId: "u1", reviewId: other.id },
      ],
    });
    await prisma.account.create({
      data: {
        userId: "u1",
        type: "oauth",
        provider: "google",
        providerAccountId: "test-google-user",
      },
    });
    await prisma.session.create({
      data: { userId: "u1", sessionToken: "test-session", expires: new Date(Date.now() + 60000) },
    });
    await prisma.verificationToken.createMany({
      data: [
        {
          identifier: "private-author@example.test",
          token: "own-token",
          expires: new Date(Date.now() + 60000),
        },
        {
          identifier: "private-other@example.test",
          token: "other-token",
          expires: new Date(Date.now() + 60000),
        },
      ],
    });
    expect(await deleteAccount("DELETE")).toEqual({ success: true });
    expect(await prisma.user.findUnique({ where: { id: "u1" } })).toBeNull();
    expect(await prisma.user.findUnique({ where: { id: "u2" } })).not.toBeNull();
    expect(await prisma.review.findUnique({ where: { id: other.id } })).not.toBeNull();
    expect(await prisma.review.count({ where: { userId: "u1" } })).toBe(0);
    expect(await prisma.reviewHelpful.count()).toBe(0);
    expect(await prisma.account.count({ where: { userId: "u1" } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: "u1" } })).toBe(0);
    expect(await prisma.reviewSubmission.count({ where: { userId: "u1" } })).toBe(0);
    expect(await prisma.requestLimit.count({ where: { key: "write:u1" } })).toBe(0);
    expect(await prisma.verificationToken.count()).toBe(1);
    expect(await prisma.module.count()).toBe(4);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/modules/MA-101");
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/modules/MA-1012");
    expect(accountSignOut).toHaveBeenCalledWith({ redirectTo: "/" });
    await expect(saveReview("u1", valid)).rejects.toMatchObject({ status: 401 });
  });

  it("rolls back if user deletion fails after related records were removed", async () => {
    const own = (await saveReview("u1", valid)).review;
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION test_prevent_account_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END; $$`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER test_account_delete BEFORE DELETE ON "User" FOR EACH ROW EXECUTE FUNCTION test_prevent_account_delete()`,
    );
    try {
      await expect(deleteOwnAccount("u1")).rejects.toBeDefined();
      expect(await prisma.review.findUnique({ where: { id: own.id } })).not.toBeNull();
      expect(await prisma.user.findUnique({ where: { id: "u1" } })).not.toBeNull();
    } finally {
      await prisma.$executeRawUnsafe(`DROP TRIGGER test_account_delete ON "User"`);
      await prisma.$executeRawUnsafe(`DROP FUNCTION test_prevent_account_delete()`);
    }
  });
});

describe("ranked PostgreSQL search", () => {
  it("puts exact codes first and handles short/empty/wildcard queries", async () => {
    expect((await searchModules("ma-101"))[0].moduleNumber).toBe("MA-101");
    expect(await searchModules(" ")).toEqual([]);
    expect(await searchModules("a")).toEqual([]);
    expect((await searchModules("100%"))[0].moduleNumber).toBe("CS-1");
    expect(await searchModules("%_")).toEqual([]);
    expect((await searchModules("Mathematik H\u00f6here"))[0].moduleNumber).toBe("DE-1");
    expect((await searchModules("Analysiz"))[0].moduleNumber).toMatch(/^MA-/);
    expect(await searchModules("zzzz-no-such-module")).toEqual([]);
  });
  it("keeps the best match even when its ID sorts last, with deterministic limits", async () => {
    await prisma.module.createMany({
      data: Array.from({ length: 25 }, (_, index) => ({
        id: `a${index}`,
        moduleNumber: `EXTRA-${index}`,
        moduleName: "Analysis laboratory",
      })),
    });
    await prisma.module.create({
      data: { id: "zzzz", moduleNumber: "ANALYSIS", moduleName: "Exact code" },
    });
    const first = await searchModules("analysis");
    expect(first).toHaveLength(10);
    expect(first[0].id).toBe("zzzz");
    expect(await searchModules("analysis")).toEqual(first);
  });
});

describe("review service and all write entry points", () => {
  it("rejects invalid data, referenced IDs and cross-user writes", async () => {
    await expect(saveReview("u1", { ...valid, summary: " ".repeat(40) })).rejects.toBeDefined();
    await expect(saveReview("u1", { ...valid, moduleId: "missing" })).rejects.toMatchObject({
      status: 404,
    });
    const { review } = await saveReview("u1", valid);
    await expect(saveReview("u2", valid, review.id)).rejects.toMatchObject({ status: 403 });
    await expect(removeReview("u2", review.id)).rejects.toMatchObject({ status: 403 });
    expect((await prisma.review.findUnique({ where: { id: review.id } }))?.summary).toBe(
      valid.summary,
    );
  });
  it("serializes submissions and retains limits after review deletion", async () => {
    const results = await Promise.allSettled([
      saveReview("u1", valid),
      saveReview("u1", { ...valid, moduleId: "m2" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const review = await prisma.review.findFirstOrThrow();
    await removeReview("u1", review.id);
    await expect(saveReview("u1", valid)).rejects.toMatchObject({ status: 429 });
    expect(await prisma.reviewSubmission.count()).toBe(1);
  });
  it("validates REST POST and PUT, with duplicate conflict and origin enforcement", async () => {
    expect(
      (await postReview(request("POST", { ...valid, overallRating: 9 }), moduleContext())).status,
    ).toBe(400);
    const created = await postReview(request("POST", valid), moduleContext());
    expect(created.status).toBe(201);
    const { id } = await created.json();
    expect((await putReview(request("PUT", { overallRating: 3.2 }), context(id))).status).toBe(400);
    expect((await putReview(request("PUT", { summary: " ".repeat(30) }), context(id))).status).toBe(
      400,
    );
    expect(
      (
        await putReview(
          request("PUT", { summary: "Updated with a complete detailed review." }),
          context(id),
        )
      ).status,
    ).toBe(200);
    expect((await putReview(request("PUT", {}, "http://attacker.test"), context(id))).status).toBe(
      403,
    );
    await prisma.reviewSubmission.updateMany({
      data: { createdAt: new Date(Date.now() - 120000) },
    });
    expect((await postReview(request("POST", valid), moduleContext())).status).toBe(409);
    identity.id = "u2";
    expect((await putReview(request("PUT", { overallRating: 4 }), context(id))).status).toBe(403);
    expect((await deleteReview(request("DELETE"), context(id))).status).toBe(403);
    identity.id = "";
    expect((await postReview(request("POST", valid), moduleContext())).status).toBe(401);
  });
  it("applies the same checks and invalidation to server actions", async () => {
    expect((await actionCreate({ ...valid, overallRating: 9 })).success).toBe(false);
    const created = await actionCreate(valid);
    expect(created.success).toBe(true);
    if (!created.success || !created.data) throw new Error("Expected created review");
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/modules/MA-101");
    identity.id = "u2";
    expect((await actionUpdate(created.data.id, valid)).success).toBe(false);
    expect((await actionDelete(created.data.id)).success).toBe(false);
    identity.id = "u1";
    expect((await actionUpdate(created.data.id, { ...valid, moduleId: "m2" })).success).toBe(true);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/modules/MA-1012");
    expect((await actionDelete(created.data.id)).success).toBe(true);
  });
});

describe("public data and bounded aggregation", () => {
  it("keeps single-statement review reads correct for empty pages, every sort, votes, and mixed rating aggregates", async () => {
    const empty = await getModuleStats("m1");
    expect(empty.reviewCount).toBe(0);
    expect(empty.averageRating).toBeNull();
    expect(empty.averageDifficulty).toBeNull();
    expect(empty.averageWorkload).toBeNull();
    expect(empty.ratingDistribution.every((bucket) => bucket.count === 0)).toBe(true);
    expect(
      (await getModuleReviews("m1", { page: 1, sortBy: "newest", semesterId: "all" })).reviews,
    ).toEqual([]);
    await prisma.user.create({ data: { id: "u3", name: "Third" } });
    await prisma.semester.create({ data: { id: "s2", name: "Sommersemester", year: 2026 } });
    await prisma.review.createMany({
      data: [
        {
          ...valid,
          id: "perf-a",
          userId: "u1",
          overallRating: 4.5,
          difficultyRating: 2.5,
          workloadRating: 4,
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
        {
          ...valid,
          id: "perf-b",
          userId: "u2",
          overallRating: 3,
          difficultyRating: 4,
          workloadRating: 2,
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
        {
          ...valid,
          id: "perf-c",
          userId: "u1",
          semesterTakenId: "s2",
          overallRating: 5,
          difficultyRating: 3,
          workloadRating: 3,
          createdAt: new Date("2026-01-02T00:00:00Z"),
        },
      ],
    });
    await prisma.reviewHelpful.createMany({
      data: [
        { reviewId: "perf-a", userId: "u2" },
        { reviewId: "perf-a", userId: "u3" },
        { reviewId: "perf-c", userId: "u2" },
      ],
    });
    const expected = {
      newest: ["perf-b", "perf-c", "perf-a"],
      oldest: ["perf-a", "perf-b", "perf-c"],
      highest: ["perf-c", "perf-a", "perf-b"],
      lowest: ["perf-b", "perf-a", "perf-c"],
      most_helpful: ["perf-a", "perf-c", "perf-b"],
    } as const;
    for (const sortBy of Object.keys(expected) as (keyof typeof expected)[]) {
      const page = await getModuleReviews("m1", { page: 1, sortBy, semesterId: "all" }, "u2");
      expect(page.reviews.map((review) => review.id)).toEqual(expected[sortBy]);
      const own = page.reviews.find((review) => review.id === "perf-b")!;
      expect(own.isOwnReview).toBe(true);
      const voted = page.reviews.find((review) => review.id === "perf-a")!;
      expect(voted.isOwnReview).toBe(false);
      expect(voted.userHasVoted).toBe(true);
      expect(voted.helpfulCount).toBe(2);
      expect(voted.createdAt).toBe("2026-01-01T00:00:00.000Z");
    }
    const beyond = await getModuleReviews("m1", { page: 2, sortBy: "newest", semesterId: "all" });
    expect(beyond.total).toBe(3);
    expect(beyond.reviews).toEqual([]);
    const filtered = await getModuleReviews("m1", { page: 1, sortBy: "newest", semesterId: "s2" });
    expect(filtered.total).toBe(1);
    expect(filtered.reviews[0].id).toBe("perf-c");
    const stats = await getModuleStats("m1");
    expect(stats.reviewCount).toBe(3);
    expect(stats.averageRating).toBe(4.2);
    expect(stats.averageDifficulty).toBe(3.2);
    expect(stats.averageWorkload).toBe(3);
    expect(stats.ratingDistribution.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(3);
  });
  it("keeps author identities anonymous through both GET routes and personalized review lists", async () => {
    await prisma.user.update({
      where: { id: "u1" },
      data: { image: "https://example.test/private-author-photo.png" },
    });
    const { review } = await saveReview("u1", valid);
    identity.id = "";
    const single = await getReview(request("GET"), context(review.id));
    const list = await getReviews(request("GET"), moduleContext());
    for (const response of [single, list]) {
      expect(response.status).toBe(200);
      const body = await response.json();
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("private-author");
      expect(serialized).not.toContain('"Author"');
      expect(serialized).not.toContain('"userId"');
      expect(serialized).not.toContain('"authorName"');
      expect(serialized).not.toContain('"authorImage"');
      expect(body).not.toHaveProperty("user");
    }
    const owner = await getModuleReviews(
      "m1",
      { page: 1, sortBy: "newest", semesterId: "all" },
      "u1",
    );
    const other = await getModuleReviews(
      "m1",
      { page: 1, sortBy: "newest", semesterId: "all" },
      "u2",
    );
    const anonymous = await getModuleReviews("m1", {
      page: 1,
      sortBy: "newest",
      semesterId: "all",
    });
    expect(owner.reviews[0].isOwnReview).toBe(true);
    expect(other.reviews[0].isOwnReview).toBe(false);
    expect(anonymous.reviews[0].isOwnReview).toBe(false);
    expect(owner.reviews[0]).not.toHaveProperty("userId");
  });
  it("paginates and filters without changing whole-module statistics", async () => {
    // Distinct semesters preserve the unique user/module/semester constraint.
    await prisma.semester.createMany({
      data: Array.from({ length: 26 }, (_, i) => ({
        id: `s${i + 2}`,
        name: "Historical",
        year: 2000 + i,
      })),
    });
    await prisma.review.createMany({
      data: Array.from({ length: 26 }, (_, i) => ({
        ...valid,
        id: `review-${String(i).padStart(2, "0")}`,
        userId: "u1",
        semesterTakenId: `s${i + 2}`,
      })),
    });
    const page1 = await getModuleReviews("m1", { page: 1, sortBy: "highest", semesterId: "all" });
    const page2 = await getModuleReviews("m1", { page: 2, sortBy: "highest", semesterId: "all" });
    expect(page1.reviews).toHaveLength(20);
    expect(page2.reviews).toHaveLength(6);
    expect(new Set([...page1.reviews, ...page2.reviews].map((r) => r.id)).size).toBe(26);
    expect(
      (await getModuleReviews("m1", { page: 1, sortBy: "newest", semesterId: "s2" })).total,
    ).toBe(1);
    const stats = await getModuleStats("m1");
    expect(stats.reviewCount).toBe(26);
    expect(stats.averageRating).toBe(4.5);
    expect(stats.ratingDistribution.reduce((sum, b) => sum + b.count, 0)).toBe(26);
  });
  it("serializes helpful toggles and invalidates the canonical module route", async () => {
    const { review } = await saveReview("u1", valid);
    expect((await toggleReviewHelpful(review.id, "m1")).success).toBe(false);
    identity.id = "u2";
    const results = await Promise.all([
      toggleReviewHelpful(review.id, "m1"),
      toggleReviewHelpful(review.id, "m1"),
    ]);
    expect(results.every((r) => r.success)).toBe(true);
    expect(await prisma.reviewHelpful.count()).toBe(0);
    expect(vi.mocked(revalidatePath)).toHaveBeenCalledWith("/modules/MA-101");
  });
  it("limits expensive reads across instances and never trusts forwarded identity by default", async () => {
    await prisma.requestLimit.create({
      data: {
        key: (await import("node:crypto")).createHash("sha256").update("global").digest("hex"),
        count: 2400,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await expect(publicReadGuard(request("GET"))).rejects.toMatchObject({ status: 429 });
  });
  it("counts failed write attempts and preserves the daily limit independently of reviews", async () => {
    await expect(saveReview("u1", { ...valid, overallRating: 9 })).rejects.toBeDefined();
    expect(
      (await prisma.requestLimit.findUniqueOrThrow({ where: { key: "write:u1" } })).count,
    ).toBe(1);
    await prisma.requestLimit.update({
      where: { key: "write:u1" },
      data: { count: 60, expiresAt: new Date(Date.now() + 60000) },
    });
    await expect(saveReview("u1", valid)).rejects.toMatchObject({ status: 429 });
    await prisma.requestLimit.deleteMany();
    await prisma.reviewSubmission.createMany({
      data: Array.from({ length: 10 }, () => ({
        userId: "u1",
        createdAt: new Date(Date.now() - 3600000),
      })),
    });
    await expect(saveReview("u1", valid)).rejects.toMatchObject({ status: 429 });
    expect(await prisma.review.count()).toBe(0);
  });
  it("keeps imports idempotent and dry runs free of writes", async () => {
    const options = {
      semesterName: "Wintersemester" as const,
      semesterYear: 2026,
      dryRun: true,
      verbose: false,
    };
    const records = [{ moduleNumber: "IM-1", moduleName: "Imported course" }];
    const before = await prisma.module.count();
    await importModules(prisma, records, options, new Logger(false));
    expect(await prisma.module.count()).toBe(before);
    await importModules(prisma, records, { ...options, dryRun: false }, new Logger(false));
    await importModules(prisma, records, { ...options, dryRun: false }, new Logger(false));
    expect(await prisma.module.count()).toBe(before + 1);
  });
});
