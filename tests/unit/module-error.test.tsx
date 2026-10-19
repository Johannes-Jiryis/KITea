// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ModuleError from "@/app/modules/[moduleNumber]/error";

afterEach(cleanup);
it("offers recovery without showing private server error details", () => {
  const reset = vi.fn();
  const { container } = render(
    <ModuleError error={new Error("private database configuration")} reset={reset} />,
  );
  expect(container.textContent).not.toContain("private database configuration");
  expect(screen.getByRole("link", { name: "Back to search" }).getAttribute("href")).toBe("/");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledTimes(1);
});
