"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ReviewCard } from "@/components/modules/review-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ModulePageData, ReviewSortOption } from "@/lib/modules/types";

type Props = {
  moduleId: string;
  reviews: ModulePageData["reviews"];
  semesters: ModulePageData["semesters"];
  reviewPage: ModulePageData["reviewPage"];
};
const sortLabels: Record<ReviewSortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  highest: "Highest rated",
  lowest: "Lowest rated",
  most_helpful: "Most helpful",
};
export const ModuleReviewsSection = ({ moduleId, reviews, semesters, reviewPage }: Props) => {
  const router = useRouter();
  const path = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();
  const update = (key: string, value: string) => {
    const params = new URLSearchParams(search.toString());
    params.set(key, value);
    if (key !== "page") params.delete("page");
    startTransition(() => router.replace(`${path}?${params.toString()}`, { scroll: false }));
  };
  return (
    <section className="space-y-5" aria-busy={pending}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Student reviews</h2>
          <p className="text-sm text-muted-foreground">
            {reviews.length} of {reviewPage.total} shown · Page {reviewPage.page}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={reviewPage.semesterId}
            onValueChange={(value) => update("semesterId", value)}
          >
            <SelectTrigger aria-label="Filter reviews by semester" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={reviewPage.sortBy} onValueChange={(value) => update("sortBy", value)}>
            <SelectTrigger aria-label="Sort reviews" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(sortLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {reviews.length ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id}>
              <ReviewCard review={review} moduleId={moduleId} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No reviews on this page. Choose another page or semester, or share your experience.
        </p>
      )}
      <nav aria-label="Review pages" className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={pending || reviewPage.page <= 1}
          onClick={() => update("page", String(reviewPage.page - 1))}
        >
          Previous
        </Button>
        <span className="text-sm" role="status">
          {pending ? "Loading reviews…" : `${reviewPage.total} matching reviews`}
        </span>
        <Button
          variant="outline"
          disabled={pending || reviewPage.page * reviewPage.pageSize >= reviewPage.total}
          onClick={() => update("page", String(reviewPage.page + 1))}
        >
          Next
        </Button>
      </nav>
    </section>
  );
};
