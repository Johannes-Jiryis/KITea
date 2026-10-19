import type { Prisma } from "@prisma/client";

// Deliberate allowlist: never serialize a raw User relation in public responses.
export const publicReviewSelect = {
  id: true,
  moduleId: true,
  semesterTakenId: true,
  summary: true,
  lecturerName: true,
  lecturerReview: true,
  taName: true,
  taReview: true,
  homeworkReview: true,
  examReview: true,
  overallRating: true,
  difficultyRating: true,
  workloadRating: true,
  createdAt: true,
  updatedAt: true,
  semesterTaken: { select: { id: true, name: true, year: true } },
} satisfies Prisma.ReviewSelect;
