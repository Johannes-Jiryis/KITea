"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { SearchResultItem } from "@/components/search/search-result-item";
import { SearchResultsSkeletonList } from "@/components/search/search-result-skeleton";
import { useSearchModules } from "@/hooks/use-search-modules";
import { cn } from "@/lib/utils";

const BLUR_DELAY_MS = 150;

export function ModuleSearchBar() {
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { results, isLoading, error, search, clear } = useSearchModules({
    debounceMs: 250,
    minQueryLength: 2,
  });

  const showDropdown = isOpen && isFocused && query.trim().length > 0;

  // Handle search when query changes
  useEffect(() => {
    search(query);
  }, [query, search]);

  useEffect(() => {
    if (activeIndex < 0 || !showDropdown) return;
    const activeEl = document.getElementById(`${listboxId}-option-${activeIndex}`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listboxId, showDropdown]);

  // Update active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // Handle click outside with delay to allow link clicks to register
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle blur with delay to prevent closing before click registers
  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, BLUR_DELAY_MS);
  }, []);

  // Clear blur timeout if focus returns
  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    setIsFocused(true);
    setIsOpen(true);
  }, []);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) {
      if (event.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
        setActiveIndex(0);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && results[activeIndex]) {
          setIsOpen(false);
          setIsFocused(false);
          router.push(`/modules/${encodeURIComponent(results[activeIndex].moduleNumber)}`);
        }
        break;
      case "Escape":
        event.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }

  const hasResults = results.length > 0;
  const showEmpty = showDropdown && !isLoading && !error && query.trim().length >= 2 && !hasResults;

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-2xl sm:max-w-3xl">
      <div
        className={cn(
          "relative rounded-2xl transition-all duration-300 ease-out",
          isFocused
            ? "search-bar-glow scale-[1.01] shadow-xl shadow-primary/15 ring-1 ring-primary/20"
            : "shadow-md shadow-black/5 hover:shadow-lg",
        )}
      >
        <div
          className={cn(
            "relative flex items-center overflow-hidden rounded-2xl border",
            "border-border/60 bg-card/80 backdrop-blur-xl",
            isFocused && "border-primary/30 bg-card/90",
          )}
        >
          <Search
            className={cn(
              "pointer-events-none absolute left-5 h-6 w-6 transition-colors duration-200",
              isFocused ? "text-primary" : "text-muted-foreground",
            )}
          />

          <input
            ref={inputRef}
            type="search"
            aria-label="Search modules by number or name"
            maxLength={80}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Enter module number or name..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showDropdown && activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            className={cn(
              "w-full border-0 bg-transparent py-6 pr-12 pl-14 text-lg",
              "text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none focus-visible:ring-0",
            )}
          />

          <div className="absolute right-3 flex items-center gap-1">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            {query && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  clear();
                  setActiveIndex(-1);
                  inputRef.current?.focus();
                }}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showDropdown && (
        <div
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-2xl",
            "border border-border/50 bg-popover/90 shadow-2xl shadow-black/10 backdrop-blur-2xl",
            "animate-in fade-in-0 slide-in-from-top-2 duration-200",
          )}
        >
          {hasResults && !isLoading && (
            <p
              role="status"
              className="border-b border-border/50 px-4 py-3 text-sm text-muted-foreground"
            >
              {results.length} {results.length === 1 ? "match" : "matches"} — choose a module
            </p>
          )}
          <div
            id={listboxId}
            role="listbox"
            aria-label="Matching modules"
            className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain"
          >
            {isLoading && <SearchResultsSkeletonList count={4} />}
            {query.trim().length === 1 && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Enter at least two characters.
              </p>
            )}

            {error && !isLoading && (
              <p className="px-4 py-6 text-center text-sm text-destructive">{error}</p>
            )}

            {showEmpty && (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No modules found for &ldquo;{query}&rdquo;
              </p>
            )}

            {hasResults &&
              !isLoading &&
              results.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  query={query}
                  result={result}
                  isActive={index === activeIndex}
                  onSelect={() => {
                    setIsOpen(false);
                    setIsFocused(false);
                  }}
                  id={`${listboxId}-option-${index}`}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
