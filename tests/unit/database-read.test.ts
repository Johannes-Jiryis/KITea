import { afterEach, expect, it, vi } from "vitest";
import { databaseRead, isDatabaseConnectionError } from "@/lib/database/read";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("replays a failed read once after a connection timeout", async () => {
  vi.useFakeTimers();
  const log = vi.spyOn(console, "warn").mockImplementation(() => {});
  const read = vi
    .fn()
    .mockRejectedValueOnce(new Error("Connection terminated due to connection timeout"))
    .mockResolvedValueOnce(["module"]);
  const result = databaseRead(read);
  await vi.advanceTimersByTimeAsync(200);
  await expect(result).resolves.toEqual(["module"]);
  expect(read).toHaveBeenCalledTimes(2);
  expect(log.mock.calls.flat().join(" ")).not.toContain("postgresql://");
});
it("stops after the second connection failure", async () => {
  vi.useFakeTimers();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = Object.assign(new Error("unreachable"), { code: "ECONNRESET" });
  const read = vi.fn().mockRejectedValue(error);
  const assertion = expect(databaseRead(read)).rejects.toBe(error);
  await vi.advanceTimersByTimeAsync(200);
  await assertion;
  expect(read).toHaveBeenCalledTimes(2);
});
it("does not retry query, permission, or validation failures", async () => {
  for (const code of ["57014", "42501", "P2002", "P2024"]) {
    const error = { code };
    const read = vi.fn().mockRejectedValue(error);
    await expect(databaseRead(read)).rejects.toBe(error);
    expect(read).toHaveBeenCalledTimes(1);
  }
});
it("recognizes nested connection errors and bounds cyclic causes", () => {
  expect(isDatabaseConnectionError({ cause: { code: "ETIMEDOUT" } })).toBe(true);
  const cyclic: { cause?: unknown } = {};
  cyclic.cause = cyclic;
  expect(isDatabaseConnectionError(cyclic)).toBe(false);
});
