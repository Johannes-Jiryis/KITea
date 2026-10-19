// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useSearchModules } from "@/hooks/use-search-modules";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const response = (name: string) =>
  ({
    ok: true,
    json: async () => ({ results: [{ id: name, moduleName: name, moduleNumber: name }] }),
  }) as Response;

it("ignores stale results and finally handlers even if fetch ignores cancellation", async () => {
  const pending: ((value: Response) => void)[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise<Response>((resolve) => pending.push(resolve))),
  );
  const { result } = renderHook(() => useSearchModules());
  act(() => result.current.search("older"));
  await act(async () => {
    vi.advanceTimersByTime(250);
  });
  act(() => result.current.search("newer"));
  await act(async () => {
    pending[0](response("older"));
  });
  expect(result.current.isLoading).toBe(true);
  expect(result.current.results).toEqual([]);
  await act(async () => {
    vi.advanceTimersByTime(250);
  });
  await act(async () => {
    pending[1](response("newer"));
  });
  expect(result.current.results[0].id).toBe("newer");
  expect(result.current.isLoading).toBe(false);
});
it("debounces and clears pending completions", async () => {
  let resolveRequest!: (value: Response) => void;
  const fetcher = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      }),
  );
  vi.stubGlobal("fetch", fetcher);
  const { result } = renderHook(() => useSearchModules());
  act(() => {
    result.current.search("abc");
    result.current.search("abcd");
  });
  await act(async () => {
    vi.advanceTimersByTime(250);
  });
  expect(fetcher).toHaveBeenCalledTimes(1);
  act(() => result.current.clear());
  await act(async () => {
    resolveRequest(response("obsolete"));
  });
  expect(result.current.results).toEqual([]);
  expect(result.current.isLoading).toBe(false);
});
