import { createHash } from "node:crypto";
import { ZodError } from "zod";
import { getPrisma } from "@/lib/prisma";
import { HttpError } from "@/lib/http/errors";

export const apiError = (error: unknown, event: string) => {
  if (error instanceof HttpError)
    return Response.json(
      { error: error.message },
      {
        status: error.status,
        headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : undefined,
      },
    );
  if (error instanceof ZodError)
    return Response.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  if (code === "P2002")
    return Response.json(
      { error: "A review already exists for this module and semester." },
      { status: 409 },
    );
  if (code === "P2003" || code === "P2025")
    return Response.json({ error: "Referenced record no longer exists." }, { status: 404 });
  console.error(JSON.stringify({ level: "error", event, code, at: new Date().toISOString() }));
  return Response.json({ error: "Service temporarily unavailable." }, { status: 503 });
};

export const readJson = async (request: Request) => {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXTAUTH_URL || request.url).origin;
  if (!origin || origin !== expected) throw new HttpError(403, "Request origin is not allowed.");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new HttpError(415, "Use application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body is required.");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 40_000) {
        await reader.cancel();
        throw new HttpError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400, "Malformed JSON.");
  } finally {
    reader.releaseLock();
  }
};

export const publicReadGuard = async (request: Request) => {
  // Only trust a proxy that overwrites this header; the runbook describes the contract.
  const trusted = process.env.TRUST_PROXY === "true";
  const client = trusted ? request.headers.get("x-real-ip") || "unknown" : "global";
  const key = createHash("sha256").update(client).digest("hex");
  const limit = trusted ? 180 : 2400;
  const rows = await getPrisma().$queryRaw<{ count: number }[]>`
    INSERT INTO "RequestLimit" (key, count, "expiresAt")
    VALUES (${key}, 1, date_trunc('minute', now()) + interval '1 minute')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "RequestLimit"."expiresAt" <= now() THEN 1 ELSE "RequestLimit".count + 1 END,
      "expiresAt" = date_trunc('minute', now()) + interval '1 minute'
    RETURNING count`;
  if (Math.random() < 0.01)
    await getPrisma()
      .$executeRaw`DELETE FROM "RequestLimit" WHERE "expiresAt" < now() - interval '1 hour'`;
  if (rows[0].count > limit)
    throw new HttpError(429, "Too many requests. Please try again shortly.", 60);
};
