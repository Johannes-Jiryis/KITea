export const GET = () =>
  Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
