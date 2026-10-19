"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Star, Trash2 } from "lucide-react";

import { deleteReview } from "@/app/actions/reviews";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { ReviewListItem } from "@/lib/reviews/serialize";
import { cn } from "@/lib/utils";

type MyReviewsListProps = {
  reviews: ReviewListItem[];
};

export function MyReviewsList({ reviews }: MyReviewsListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(reviewId: string) {
    setPendingId(reviewId);
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      setPendingId(null);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Delete failed",
          description: result.error,
        });
        return;
      }

      toast({ title: "Review deleted" });
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return (
      <Card className="border-border/50 border-dashed bg-card/50">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">You haven&apos;t written any reviews yet.</p>
          <Button asChild>
            <Link href="/write-review">Write your first review</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((review) => (
        <li key={review.id}>
          <Card
            className={cn(
              "border-border/50 bg-card/80 transition-all hover:shadow-md",
              isPending && pendingId === review.id && "opacity-60",
            )}
          >
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-muted-foreground">{review.moduleNumber}</p>
                <Link
                  href={`/modules/${encodeURIComponent(review.moduleNumber)}`}
                  className="truncate font-medium text-foreground hover:text-primary hover:underline"
                >
                  {review.moduleName}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{review.semesterLabel}</p>
                {review.summary && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {review.summary}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium tabular-nums">
                    {review.overallRating.toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/write-review/${review.id}/edit`}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isPending && pendingId === review.id}
                    >
                      {isPending && pendingId === review.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Delete
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this review?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes your review for{" "}
                        <span className="font-medium text-foreground">{review.moduleName}</span>.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(review.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
