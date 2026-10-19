import { spawn } from "node:child_process";
import { cp } from "node:fs/promises";

const main = async () => {
  const healthyDatabase =
    process.env.TEST_DATABASE === "true" &&
    process.env.DATABASE_URL === "postgresql://kitea_test:kitea_test@127.0.0.1:55432/kitea_test";
  await cp("public", ".next/standalone/public", { recursive: true });
  await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: "production",
    PORT: "3100",
    HOSTNAME: "127.0.0.1",
    DATABASE_URL: healthyDatabase
      ? process.env.DATABASE_URL!
      : "postgresql://smoke:smoke@127.0.0.1:1/smoke",
    NEXTAUTH_URL: "https://example.test",
    NEXTAUTH_SECRET: "smoke-only-test-secret-12345678901234567890123456789",
    GOOGLE_CLIENT_ID: "smoke-placeholder",
    GOOGLE_CLIENT_SECRET: "smoke-placeholder",
  };
  const child = spawn(process.execPath, [".next/standalone/server.js"], {
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  const url = "http://127.0.0.1:3100";
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (child.exitCode !== null) throw new Error("Production server exited.");
      try {
        ready = (await fetch(`${url}/api/health/live`)).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error("Production server did not start.");
    const home = await fetch(url);
    const html = await home.text();
    if (!home.ok || !html.includes("KITea")) throw new Error("Homepage smoke failed.");
    if (home.headers.get("x-content-type-options") !== "nosniff")
      throw new Error("Missing security headers.");
    const asset = html.match(/href="([^"]+_next\/static\/[^"]+\.css[^"]*)"/)?.[1];
    if (!asset || !(await fetch(new URL(asset, url))).ok)
      throw new Error("Standalone static assets unavailable.");
    const readiness = await fetch(`${url}/api/health/ready`);
    const expected = healthyDatabase ? 200 : 503;
    if (readiness.status !== expected)
      throw new Error("Readiness did not reflect database availability.");
    const search = await fetch(`${url}/api/search/modules?q=analysis`);
    if (search.status !== expected)
      throw new Error("Search did not reflect database availability.");
    if ((await fetch(`${url}/profile`, { redirect: "manual" })).status !== 307)
      throw new Error("Protected page did not redirect.");
    console.log(
      `Standalone smoke passed: homepage/assets, headers, liveness, ${healthyDatabase ? "healthy" : "unavailable"} database behavior and protected redirect.`,
    );
  } finally {
    child.kill();
    await new Promise<void>((resolve) => {
      if (child.exitCode !== null) resolve();
      else child.once("exit", () => resolve());
    });
  }
};
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
