"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ModuleSearchResult } from "@/lib/search/types";
import { normalizeSearchQuery } from "@/lib/search/normalize";

export const useSearchModules = ({ debounceMs = 250, minQueryLength = 2 } = {}) => {
  const [results, setResults] = useState<ModuleSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    generation.current++;
    clearTimeout(timer.current);
    controller.current?.abort();
  }, []);
  useEffect(() => cancel, [cancel]);

  const clear = useCallback(() => {
    cancel();
    setResults([]);
    setError(null);
    setIsLoading(false);
  }, [cancel]);

  const search = useCallback(
    (raw: string) => {
      cancel();
      const query = normalizeSearchQuery(raw);
      const requestId = generation.current;
      setResults([]);
      setError(null);
      if (query.length < minQueryLength) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      timer.current = setTimeout(async () => {
        const current = new AbortController();
        controller.current = current;
        try {
          const response = await fetch(`/api/search/modules?q=${encodeURIComponent(query)}`, {
            signal: current.signal,
          });
          if (!response.ok)
            throw new Error(
              response.status === 429
                ? "Too many searches. Please wait a moment."
                : "Search is temporarily unavailable. Please try again.",
            );
          const data: { results: ModuleSearchResult[] } = await response.json();
          if (generation.current === requestId) setResults(data.results);
        } catch (err) {
          if (generation.current !== requestId || current.signal.aborted) return;
          setError(err instanceof Error ? err.message : "Search failed.");
        } finally {
          if (generation.current === requestId) setIsLoading(false);
        }
      }, debounceMs);
    },
    [cancel, debounceMs, minQueryLength],
  );

  return { results, isLoading, error, search, clear };
};
