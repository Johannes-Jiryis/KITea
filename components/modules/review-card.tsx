"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Star, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { HelpfulButton } from "@/components/modules/helpful-button";
import { MarkdownPreview } from "@/components/reviews/markdown-preview";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ModuleReviewItem } from "@/lib/modules/types";
import { cn } from "@/lib/utils";

type ReviewCardProps = {
  review: ModuleReviewItem;
  moduleId: string;
};

function ReviewSection({ title, content }: { title: string; content: string | null }) {
  if (!content?.trim()) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <MarkdownPreview content={content} />
    </div>
  );
}

export function ReviewCard({ review, moduleId }: ReviewCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const isOwnReview = review.isOwnReview;
  const hasDetails =
    review.lecturerReview || review.taReview || review.homeworkReview || review.examReview;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        console.error("Failed to delete review");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
    }
  };

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm",
        "transition-all duration-300 hover:border-border hover:shadow-md",
      )}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border/50">
              <AvatarFallback className="text-xs">AS</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">Anonymous student</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {review.semesterLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {review.overallRating.toFixed(1)}
              </span>
            </div>
            {isOwnReview && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Review actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/write-review/${review.id}/edit`)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {review.summary && (
          <div className="mt-4">
            <MarkdownPreview content={review.summary} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            Difficulty:{" "}
            <strong className="text-foreground">{review.difficultyRating.toFixed(1)}</strong>
          </span>
          <span>
            Workload:{" "}
            <strong className="text-foreground">{review.workloadRating.toFixed(1)}</strong>
          </span>
          {review.lecturerName && (
            <span>
              Lecturer: <strong className="text-foreground">{review.lecturerName}</strong>
            </span>
          )}
        </div>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            {expanded ? "Hide details" : "Show details"}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          </button>
        )}

        {expanded && hasDetails && (
          <div className="mt-4 space-y-4 border-t border-border/40 pt-4 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <ReviewSection
              title={review.lecturerName ? `About ${review.lecturerName}` : "Lecturer"}
              content={review.lecturerReview}
            />
            <ReviewSection
              title={review.taName ? `About TA ${review.taName}` : "Teaching assistant"}
              content={review.taReview}
            />
            <ReviewSection title="Homework" content={review.homeworkReview} />
            <ReviewSection title="Exam" content={review.examReview} />
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
          <HelpfulButton
            reviewId={review.id}
            moduleId={moduleId}
            initialCount={review.helpfulCount}
            initialVoted={review.userHasVoted}
            isOwnReview={isOwnReview}
          />
        </div>
      </div>
    </article>
  );
}
