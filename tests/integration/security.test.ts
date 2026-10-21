import { afterAll, beforeAll, expect, it } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { buildSearchQuery } from "@/lib/search/query";
import { fixtureBody } from "@/scripts/test-security-fixture";

const prisma = getPrisma();
beforeAll(() => {
  if (
    process.env.TEST_DATABASE !== "true" ||
    !process.env.DATABASE_URL?.includes("127.0.0.1:55432/kitea_test")
  )
    throw new Error("Only run against disposable PostgreSQL.");
});
afterAll(async () => prisma.$disconnect());

it("pins trigger search paths and removes anonymous/authenticated direct execution", async () => {
  const rows = await prisma.$queryRaw<
    { name: string; config: string[]; definer: boolean; anon: boolean; authenticated: boolean }[]
  >`
    SELECT p.proname::text AS name, p.proconfig AS config, p.prosecdef AS definer,
      has_function_privilege('anon',p.oid,'EXECUTE') AS anon,
      has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname IN ('enforce_module_alias','resolve_review_module')`;
  expect(rows).toHaveLength(2);
  for (const row of rows) {
    expect(row.config).toContain('search_path=""');
    expect(row.definer).toBe(false);
    expect(row.anon).toBe(false);
    expect(row.authenticated).toBe(false);
  }
});

it("retains the provider RLS event trigger and service access while denying API roles", async () => {
  const [routine] = await prisma.$queryRaw<
    { body: string; definer: boolean; service: boolean; anon: boolean; authenticated: boolean }[]
  >`
    SELECT p.prosrc AS body, p.prosecdef AS definer,
      has_function_privilege('service_role',p.oid,'EXECUTE') AS service,
      has_function_privilege('anon',p.oid,'EXECUTE') AS anon,
      has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='rls_auto_enable'`;
  expect(routine.body.trim()).toBe(fixtureBody.trim());
  expect(routine).toMatchObject({
    definer: true,
    service: true,
    anon: false,
    authenticated: false,
  });
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`CREATE TABLE public."_SecurityRlsProbe" (id integer)`;
    const [table] = await tx.$queryRaw<{ enabled: boolean }[]>`
      SELECT relrowsecurity AS enabled FROM pg_class WHERE oid='public."_SecurityRlsProbe"'::regclass`;
    expect(table.enabled).toBe(true);
    await tx.$executeRaw`DROP TABLE public."_SecurityRlsProbe"`;
  });
});

it("keeps trigram indexes and typo search functional without extensions on the search path", async () => {
  const [extension] = await prisma.$queryRaw<{ schema: string }[]>`
    SELECT n.nspname::text AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_trgm'`;
  expect(extension.schema).toBe("extensions");
  const indexes = await prisma.$queryRaw<{ valid: boolean; schema: string }[]>`
    SELECT i.indisvalid AS valid, n.nspname::text AS schema FROM pg_index i
    JOIN pg_class c ON c.oid=i.indexrelid JOIN pg_opclass op ON op.oid=i.indclass[0]
    JOIN pg_namespace n ON n.oid=op.opcnamespace
    WHERE c.relname IN ('Module_moduleNumber_trgm_idx','Module_moduleName_trgm_idx')`;
  expect(indexes).toHaveLength(2);
  for (const index of indexes) expect(index).toEqual({ valid: true, schema: "extensions" });
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL search_path = pg_catalog, public`;
    const [result] = await tx.$queryRaw<{ similarity: number; typo: boolean }[]>`
      SELECT extensions.similarity('analysis','analysis') AS similarity, 'analysis' OPERATOR(extensions.%) 'analysiz' AS typo`;
    expect(result).toEqual({ similarity: 1, typo: true });
    await tx.$queryRaw(buildSearchQuery("Analysiz"));
  });
});
