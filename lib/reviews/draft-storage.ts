import type { ReviewFormValues } from "@/lib/reviews/schema";

const DRAFT_PREFIX = "kitea-review-draft";

export function getDraftKey(userId: string, moduleId: string, reviewId?: string) {
  if (reviewId) return `${DRAFT_PREFIX}:edit:${userId}:${reviewId}`;
  return `${DRAFT_PREFIX}:new:${userId}:${moduleId || "none"}`;
}

export function loadDraft(key: string): Partial<ReviewFormValues> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ReviewFormValues>;
  } catch {
    return null;
  }
}

export function saveDraft(key: string, values: Partial<ReviewFormValues>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function clearDraft(key: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
