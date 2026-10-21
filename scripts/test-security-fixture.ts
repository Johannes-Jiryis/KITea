import { getPrisma } from "../lib/prisma";

// Emulate only the provider event trigger needed to verify grants on plain PostgreSQL.
export const fixtureBody = `
DECLARE cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_catalog.pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND schema_name = 'public' AND object_type IN ('table', 'partitioned table')
  LOOP
    EXECUTE pg_catalog.format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
  END LOOP;
END;
`;

const main = async () => {
  if (
    process.env.TEST_DATABASE !== "true" ||
    !process.env.DATABASE_URL?.includes("127.0.0.1:55432/kitea_test")
  )
    throw new Error("Security fixture is restricted to disposable PostgreSQL.");
  const prisma = getPrisma();
  try {
    await prisma.$executeRawUnsafe(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
    END $$`);
    // Static test DDL only; no user input is interpolated.
    await prisma.$executeRawUnsafe(`CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $fixture$${fixtureBody}$fixture$`);
    await prisma.$executeRaw`GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO anon, authenticated, service_role`;
    await prisma.$executeRaw`CREATE EVENT TRIGGER test_auto_rls ON ddl_command_end EXECUTE FUNCTION public.rls_auto_enable()`;
  } finally {
    await prisma.$disconnect();
  }
};

if (process.argv[1]?.endsWith("test-security-fixture.ts"))
  main().catch(() => {
    console.error("Disposable security fixture setup failed.");
    process.exitCode = 1;
  });
