// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ModuleSearchBar } from "@/components/search/module-search-bar";

const { push, results } = vi.hoisted(() => ({
  push: vi.fn(),
  results: [
    { id: "one", moduleNumber: "M-INFO-1", moduleName: "Machine Learning" },
    { id: "two", moduleNumber: "M-INFO-2", moduleName: "Advanced Machine Learning" },
    { id: "three", moduleNumber: "M-INFO-3", moduleName: "Machine Learning Lab" },
  ],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/hooks/use-search-modules", () => ({
  useSearchModules: () => ({
    results,
    isLoading: false,
    error: null,
    search: searchMock,
    clear: clearMock,
  }),
}));
const { searchMock, clearMock } = vi.hoisted(() => ({ searchMock: vi.fn(), clearMock: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows every returned choice and waits for an explicit keyboard selection", () => {
  // jsdom does not implement scrolling layout.
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scroll,
  });
  render(<ModuleSearchBar />);
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "machine" } });
  expect(screen.getAllByRole("option")).toHaveLength(3);
  expect(screen.getByRole("status").textContent).toContain("3 matches");
  expect(screen.getAllByRole("option").map((option) => option.getAttribute("href"))).toEqual([
    "/modules/M-INFO-1",
    "/modules/M-INFO-2",
    "/modules/M-INFO-3",
  ]);
  fireEvent.keyDown(input, { key: "Enter" });
  expect(push).not.toHaveBeenCalled();
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(screen.getAllByRole("option")[1].getAttribute("aria-selected")).toBe("true");
  fireEvent.keyDown(input, { key: "Enter" });
  expect(push).toHaveBeenCalledWith("/modules/M-INFO-2");
});
