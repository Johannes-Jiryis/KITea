import type { Review } from "@prisma/client";

import type { ReviewFormValues } from "@/lib/reviews/schema";

export type ReviewListItem = {
  id: string;
  moduleId: string;
  moduleNumber: string;
  moduleName: string;
  semesterLabel: string;
  overallRating: number;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toReviewFormValues(review: Review): ReviewFormValues {
  return {
    moduleId: review.moduleId,
    semesterTakenId: review.semesterTakenId,
    lecturerName: review.lecturerName ?? undefined,
    lecturerReview: review.lecturerReview ?? undefined,
    taName: review.taName ?? undefined,
    taReview: review.taReview ?? undefined,
    homeworkReview: review.homeworkReview ?? undefined,
    examReview: review.examReview ?? undefined,
    summary: review.summary ?? "",
    overallRating: Number(review.overallRating),
    difficultyRating: Number(review.difficultyRating),
    workloadRating: Number(review.workloadRating),
  };
}

export function semesterLabel(name: string, year: number) {
  return `${name} ${year}`;
}
