// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ReviewCard } from "@/components/modules/review-card";
import type { ModuleReviewItem } from "@/lib/modules/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/actions/review-helpful", () => ({ toggleReviewHelpful: vi.fn() }));
afterEach(cleanup);
const review: ModuleReviewItem = {
  id: "review",
  isOwnReview: false,
  semesterId: "semester",
  semesterLabel: "Wintersemester 2026",
  overallRating: 4,
  difficultyRating: 3,
  workloadRating: 3,
  summary: "Useful course.",
  lecturerName: null,
  lecturerReview: null,
  taName: null,
  taReview: null,
  homeworkReview: null,
  examReview: null,
  helpfulCount: 0,
  userHasVoted: false,
  createdAt: "2026-10-20T00:00:00Z",
};
it("uses an anonymous label and avatar even if old author fields are passed", () => {
  const legacy = {
    ...review,
    authorName: "Private Author",
    authorImage: "https://example.test/private-photo.png",
  };
  const { container } = render(<ReviewCard review={legacy} moduleId="module" />);
  expect(screen.getByText("Anonymous student")).toBeTruthy();
  expect(container.textContent).not.toContain("Private Author");
  expect(container.querySelector("img")).toBeNull();
  expect(screen.queryByRole("button", { name: "Review actions" })).toBeNull();
});
it("keeps owner controls and blocks self-voting without exposing the owner's identity", () => {
  render(<ReviewCard review={{ ...review, isOwnReview: true }} moduleId="module" />);
  expect(screen.getByRole("button", { name: "Review actions" })).toBeTruthy();
  expect(
    (screen.getByTitle("You cannot vote on your own review") as HTMLButtonElement).disabled,
  ).toBe(true);
  expect(screen.getByText("Anonymous student")).toBeTruthy();
});
