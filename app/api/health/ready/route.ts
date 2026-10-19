import { getEnv } from "@/lib/env";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const GET = async () => {
  try {
    getEnv();
    await getPrisma().$queryRaw`SELECT 1 FROM "RequestLimit" LIMIT 1`;
    return Response.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
};
