"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { HighlightedText } from "@/components/search/highlighted-text";

type SearchResultItemProps = {
  result: {
    id: string;
    moduleNumber: string;
    moduleName: string;
    highlightedModuleNumber?: string;
    highlightedModuleName?: string;
  };
  isActive?: boolean;
  query?: string;
  onSelect?: () => void;
  id?: string;
};

export const SearchResultItem = forwardRef<HTMLAnchorElement, SearchResultItemProps>(
  function SearchResultItem({ result, isActive, onSelect, id, query = "" }, ref) {
    return (
      <Link
        ref={ref}
        id={id}
        href={`/modules/${encodeURIComponent(result.moduleNumber)}`}
        role="option"
        aria-selected={isActive}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150",
          "hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60",
          "no-underline hover:no-underline focus-visible:no-underline",
          isActive && "bg-muted/70",
        )}
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs text-muted-foreground">
            <HighlightedText text={result.moduleNumber} query={query} />
          </p>
          <p className="truncate text-sm font-medium text-foreground">
            <HighlightedText text={result.moduleName} query={query} />
          </p>
        </div>

        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform",
            isActive && "translate-x-0.5 text-primary",
          )}
        />
      </Link>
    );
  },
);
