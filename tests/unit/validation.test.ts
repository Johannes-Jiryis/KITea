import { describe, expect, it } from "vitest";
import { reviewFormSchema } from "@/lib/reviews/schema";
import { envSchema } from "@/lib/env";
import { normalizeSearchQuery } from "@/lib/search/normalize";
import { escapeLike } from "@/lib/search/query";

const valid = {
  moduleId: "module",
  semesterTakenId: "semester",
  summary: "A useful and detailed course review.",
  overallRating: 4.5,
  difficultyRating: 3,
  workloadRating: 2.5,
};
describe("review boundary validation", () => {
  it("trims before checking minimum summary length", () => {
    expect(reviewFormSchema.safeParse({ ...valid, summary: " ".repeat(40) }).success).toBe(false);
    expect(reviewFormSchema.safeParse({ ...valid, summary: " ".repeat(30) + "tiny" }).success).toBe(
      false,
    );
  });
  it.each([0, -1, 5.5, 3.2, Infinity, NaN, true, {}, []])(
    "rejects invalid rating %j",
    (overallRating) => {
      expect(reviewFormSchema.safeParse({ ...valid, overallRating }).success).toBe(false);
    },
  );
  it("accepts half stars and rejects oversized fields", () => {
    expect(reviewFormSchema.parse(valid).overallRating).toBe(4.5);
    expect(reviewFormSchema.safeParse({ ...valid, examReview: "x".repeat(5001) }).success).toBe(
      false,
    );
  });
});
describe("search input", () => {
  it("normalizes whitespace and compatibility characters, preserving umlauts", () => {
    expect(
      normalizeSearchQuery("  \uFF2D\uFF21-\uFF11\uFF10\uFF11  f\u00FCr   \u00DCbungen "),
    ).toBe("MA-101 f\u00FCr \u00DCbungen");
    expect(normalizeSearchQuery("x".repeat(100))).toHaveLength(80);
    expect(escapeLike("a%_\\b")).toBe("a\\%\\_\\\\b");
  });
});
describe("production configuration", () => {
  const production = {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://test:test@localhost/test",
    GOOGLE_CLIENT_ID: "test",
    GOOGLE_CLIENT_SECRET: "test",
    NEXTAUTH_URL: "https://example.test",
    NEXTAUTH_SECRET: "test-only-random-looking-value-1234567890",
  };
  it("requires secrets, HTTPS and credentials without a bypass", () => {
    expect(envSchema.safeParse(production).success).toBe(true);
    for (const patch of [
      { NEXTAUTH_SECRET: "" },
      { NEXTAUTH_SECRET: "development-secret-change-in-production" },
      { NEXTAUTH_URL: "http://example.test" },
      { GOOGLE_CLIENT_ID: "" },
      { SKIP_ENV_VALIDATION: "true" },
    ])
      expect(envSchema.safeParse({ ...production, ...patch }).success).toBe(false);
  });
});
