import { expect, it, vi } from "vitest";
import { readJson, apiError } from "@/lib/http/api";
import { HttpError } from "@/lib/http/errors";
const request = (body: string, origin = "https://example.test") =>
  new Request("https://example.test/api/reviews", {
    method: "POST",
    body,
    headers: { origin, "content-type": "application/json" },
  });

it("requires same-origin JSON and rejects malformed or oversized bodies", async () => {
  vi.stubEnv("NEXTAUTH_URL", "https://example.test");
  await expect(readJson(request('{"ok":true}'))).resolves.toEqual({ ok: true });
  await expect(readJson(request("{}", "https://attacker.test"))).rejects.toMatchObject({
    status: 403,
  });
  await expect(readJson(request("{"))).rejects.toMatchObject({ status: 400 });
  await expect(readJson(request("x".repeat(40001)))).rejects.toMatchObject({ status: 413 });
  vi.unstubAllEnvs();
});
it("returns retry information without exposing errors", async () => {
  const result = apiError(new HttpError(429, "Wait.", 60), "test");
  expect(result.status).toBe(429);
  expect(result.headers.get("Retry-After")).toBe("60");
  expect(await apiError({ code: "P2002", secret: "private" }, "test").text()).not.toContain(
    "private",
  );
});
