export type ModuleReviewItem = {
  id: string;
  isOwnReview: boolean;
  semesterId: string;
  semesterLabel: string;
  overallRating: number;
  difficultyRating: number;
  workloadRating: number;
  summary: string | null;
  lecturerName: string | null;
  lecturerReview: string | null;
  taName: string | null;
  taReview: string | null;
  homeworkReview: string | null;
  examReview: string | null;
  helpfulCount: number;
  userHasVoted: boolean;
  createdAt: string;
};

export type ModulePageData = {
  id: string;
  moduleNumber: string;
  moduleName: string;
  description: string | null;
  semesters: { id: string; label: string }[];
  stats: {
    reviewCount: number;
    averageRating: number | null;
    averageDifficulty: number | null;
    averageWorkload: number | null;
    ratingDistribution: { rating: string; count: number }[];
  };
  reviews: ModuleReviewItem[];
  reviewPage: import("@/lib/modules/review-query").ReviewQuery & {
    total: number;
    pageSize: number;
  };
};

export type ReviewSortOption = "newest" | "oldest" | "highest" | "lowest" | "most_helpful";
