import EmbeddedPostgres from "embedded-postgres";
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, cp, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const main = async () => {
  const mode = process.argv[2] || "integration";
  if (!["integration", "benchmark", "e2e", "smoke"].includes(mode))
    throw new Error("Unknown test mode.");
  await mkdir(".work", { recursive: true });
  const databaseDir = await mkdtemp(resolve(".work", "postgres-"));
  const postgres = new EmbeddedPostgres({
    databaseDir,
    port: 55432,
    user: "kitea_test",
    password: "kitea_test",
    persistent: true,
    createPostgresUser: false,
    postgresFlags: ["-h", "127.0.0.1", "-c", "max_connections=60", "-c", "timezone=UTC"],
    initdbFlags: ["--encoding=UTF8", "--locale=C"],
    onLog: () => {},
    onError: () => {},
  });
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    DATABASE_URL: "postgresql://kitea_test:kitea_test@127.0.0.1:55432/kitea_test",
    NODE_ENV: "test",
    INTEGRATION_TESTS: "true",
    TEST_DATABASE: "true",
    NEXTAUTH_URL: "http://localhost:3000",
    NEXTAUTH_SECRET: "test-only-secret-123456789012345678901234567890",
    GOOGLE_CLIENT_ID: "test-placeholder",
    GOOGLE_CLIENT_SECRET: "test-placeholder",
    TRUST_PROXY: "false",
  };
  const run = (script: string, args: string[] = [], override: Partial<NodeJS.ProcessEnv> = {}) =>
    new Promise<void>((resolveRun, reject) => {
      const child = spawn(process.execPath, [script, ...args], {
        env: { ...env, ...override },
        stdio: "inherit",
        windowsHide: true,
      });
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0 ? resolveRun() : reject(new Error(`Test command failed (${code})`)),
      );
    });
  try {
    await postgres.initialise();
    await postgres.start();
    await postgres.createDatabase("kitea_test");
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
    // A second application must be a harmless no-op.
    await run("node_modules/prisma/build/index.js", ["migrate", "deploy"]);
    if (mode === "integration") {
      await run("node_modules/vitest/vitest.mjs", ["run"]);
      await postgres.createDatabase("kitea_upgrade_test");
      const baselineMigrations = await mkdtemp(resolve(".work", "upgrade-migrations-"));
      for (const name of ["20260524214040_init", "20260525121157_enable_pg_trgm"])
        await cp(resolve("prisma/migrations", name), resolve(baselineMigrations, name), {
          recursive: true,
        });
      await cp(
        "prisma/migrations/migration_lock.toml",
        resolve(baselineMigrations, "migration_lock.toml"),
      );
      const configFile = resolve(".work", "upgrade.config.ts");
      await writeFile(
        configFile,
        `import { defineConfig } from "prisma/config"; export default defineConfig({ schema: ${JSON.stringify(resolve("prisma/schema.prisma"))}, datasource: { url: process.env.DATABASE_URL! }, migrations: { path: ${JSON.stringify(baselineMigrations)} } });`,
      );
      const upgradeEnv = {
        DATABASE_URL: "postgresql://kitea_test:kitea_test@127.0.0.1:55432/kitea_upgrade_test",
      };
      await run(
        "node_modules/prisma/build/index.js",
        ["migrate", "deploy", "--config", configFile],
        upgradeEnv,
      );
      await run("node_modules/tsx/dist/cli.mjs", ["scripts/verify-upgrade.ts", "seed"], upgradeEnv);
      await run("node_modules/prisma/build/index.js", ["migrate", "deploy"], upgradeEnv);
      await run(
        "node_modules/tsx/dist/cli.mjs",
        ["scripts/verify-upgrade.ts", "check"],
        upgradeEnv,
      );
    }
    if (mode === "benchmark")
      await run("node_modules/tsx/dist/cli.mjs", ["scripts/benchmark-search.ts"]);
    if (mode === "e2e") await run("node_modules/playwright/cli.js", ["test"]);
    if (mode === "smoke")
      await run("node_modules/tsx/dist/cli.mjs", ["scripts/smoke-production.ts"]);
  } finally {
    await postgres.stop();
    // Data is retained in the ignored .work directory for inspection, never recursively deleted.
  }
};
main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
