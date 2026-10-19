"use client";

import { useEffect, useState, useTransition } from "react";
import { ThumbsUp } from "lucide-react";

import { toggleReviewHelpful } from "@/app/actions/review-helpful";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type HelpfulButtonProps = {
  reviewId: string;
  moduleId: string;
  initialCount: number;
  initialVoted: boolean;
  isOwnReview: boolean;
};

export function HelpfulButton({
  reviewId,
  moduleId,
  initialCount,
  initialVoted,
  isOwnReview,
}: HelpfulButtonProps) {
  const { toast } = useToast();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [isPending, startTransition] = useTransition();
  useEffect(() => {
    setCount(initialCount);
    setVoted(initialVoted);
  }, [initialCount, initialVoted]);

  function handleClick() {
    if (isOwnReview) return;

    startTransition(async () => {
      const result = await toggleReviewHelpful(reviewId, moduleId);

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Could not update vote",
          description: result.error,
        });
        return;
      }

      setCount(result.helpfulCount);
      setVoted(result.userHasVoted);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={isPending || isOwnReview}
      onClick={handleClick}
      title={
        isOwnReview
          ? "You cannot vote on your own review"
          : voted
            ? "Remove helpful vote"
            : "Mark as helpful"
      }
      className={cn(
        "h-8 gap-1.5 text-muted-foreground transition-colors",
        voted && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
      )}
    >
      <ThumbsUp className={cn("h-3.5 w-3.5", voted && "fill-current")} />
      <span className="tabular-nums text-xs">{count}</span>
      <span className="sr-only">helpful votes</span>
    </Button>
  );
}
