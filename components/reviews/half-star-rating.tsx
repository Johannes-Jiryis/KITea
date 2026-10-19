"use client";

import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

type HalfStarRatingProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function HalfStarRating({ value, onChange, disabled, size = "md" }: HalfStarRatingProps) {
  const starSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const buttonSize = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <div className="inline-flex items-center gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = value >= star;
        const halfFilled = value >= star - 0.5 && value < star;

        return (
          <div key={star} className={cn("relative", buttonSize)}>
            <Star
              className={cn(starSize, "text-muted-foreground/25 transition-colors")}
              aria-hidden
            />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: halfFilled ? "50%" : filled ? "100%" : "0%" }}
            >
              <Star className={cn(starSize, "fill-amber-400 text-amber-400")} aria-hidden />
            </div>
            <button
              type="button"
              disabled={disabled}
              aria-label={`${star - 0.5} stars`}
              className="absolute inset-y-0 left-0 z-10 w-1/2 rounded-l-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onChange(star - 0.5)}
            />
            <button
              type="button"
              disabled={disabled}
              aria-label={`${star} stars`}
              className="absolute inset-y-0 right-0 z-10 w-1/2 rounded-r-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onChange(star)}
            />
          </div>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm tabular-nums text-muted-foreground">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
