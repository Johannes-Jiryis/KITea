import type { ModuleReviewItem, ReviewSortOption } from "@/lib/modules/types";

export function filterReviewsBySemester(reviews: ModuleReviewItem[], semesterId: string | "all") {
  if (semesterId === "all") return reviews;
  return reviews.filter((review) => review.semesterId === semesterId);
}

export function sortReviews(
  reviews: ModuleReviewItem[],
  sort: ReviewSortOption,
): ModuleReviewItem[] {
  const sorted = [...reviews];

  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    case "highest":
      return sorted.sort((a, b) => b.overallRating - a.overallRating);
    case "lowest":
      return sorted.sort((a, b) => a.overallRating - b.overallRating);
    case "most_helpful":
      return sorted.sort((a, b) => b.helpfulCount - a.helpfulCount);
    case "newest":
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}
