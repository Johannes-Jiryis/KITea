import { expect, it } from "vitest";
import { handbookLinks, handbookParent, matchingParents } from "@/scripts/lib/handbook-links";

it("resolves the same reused course number by its official title and semester", () => {
  expect(
    handbookParent("2400194", "Sampling Methods for Machine Learning", {
      name: "Sommersemester",
      year: 2026,
    }),
  ).toBe("M-INFO-107090");
  expect(
    handbookParent("2400194", "Sampling Methods for Machine Learning", {
      name: "Wintersemester",
      year: 2026,
    }),
  ).toBeUndefined();
  expect(
    handbookParent(
      "2400194",
      "Failing Forward: Robotics, Critical Reading and the Making of Good Research - Seminar",
      { name: "Wintersemester", year: 2026 },
    ),
  ).toBe("M-INFO-107436");
});
it("does not invent a single parent when the same teaching event belongs to several modules", () => {
  const link = handbookLinks.find((row) => row.courseNumber === "2530214")!;
  expect(
    matchingParents(link, "Advanced Corporate Finance", [{ name: "Sommersemester", year: 2026 }])
      .length,
  ).toBeGreaterThan(1);
  expect(
    handbookParent("2530214", "Advanced Corporate Finance", { name: "Sommersemester", year: 2026 }),
  ).toBeUndefined();
});
it("accepts case/spacing/punctuation differences but rejects unrelated names", () => {
  expect(
    handbookParent("2400034", "Exercise for Machine Learning for the Natural Sciences", {
      name: "Sommersemester",
      year: 2026,
    }),
  ).toBe("M-INFO-106959");
  expect(
    handbookParent("2400034", "UNRELATED COURSE", { name: "Sommersemester", year: 2026 }),
  ).toBeUndefined();
});

it("does not infer uniqueness when a matching-semester row has an unreadable title", () => {
  expect(
    matchingParents(
      {
        courseNumber: "2400008",
        moduleNumbers: ["M-INFO-106959"],
        pages: [1],
        variants: [{ title: "", term: "SS 2026", moduleNumbers: ["M-INFO-106959"], pages: [1] }],
      },
      "Machine Learning",
      [{ name: "Sommersemester", year: 2026 }],
    ),
  ).toEqual([]);
});
