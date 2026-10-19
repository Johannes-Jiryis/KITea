// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import ModulePage, { generateMetadata } from "@/app/modules/[moduleNumber]/page";

const { load, metadata, refresh } = vi.hoisted(() => ({
  load: vi.fn(),
  metadata: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: async () => null }));
vi.mock("@/lib/modules/get-module-page", () => ({ getModulePageData: load }));
vi.mock("@/lib/modules/get-module", () => ({ getModuleByNumber: metadata }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
  notFound: () => {
    throw new Error("not found");
  },
}));
vi.mock("@/components/navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/footer", () => ({ Footer: () => null }));
vi.mock("@/components/modules/module-page-content", () => ({ ModulePageContent: () => null }));

const props = () => ({
  params: Promise.resolve({ moduleNumber: "M-INFO-106303" }),
  searchParams: Promise.resolve({}),
});
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

it("renders recovery for a persistent connection failure without throwing a server exception", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  load.mockRejectedValue(new Error("Connection terminated due to connection timeout"));
  render(await ModulePage(props()));
  expect(screen.getByRole("heading").textContent).toBe("Database temporarily unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalled();
  log.mockRestore();
});
it("uses fallback metadata when the database connection fails", async () => {
  metadata.mockRejectedValue({ code: "ECONNRESET" });
  await expect(generateMetadata(props())).resolves.toEqual({
    title: "Module temporarily unavailable | KITea",
  });
});
it("preserves unexpected errors for the error boundary", async () => {
  const error = new Error("unexpected programming error");
  load.mockRejectedValue(error);
  await expect(ModulePage(props())).rejects.toBe(error);
});
