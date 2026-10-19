import { expect, it } from "vitest";
import { databaseConnection } from "@/lib/database/connection";

it("preserves local database configuration when no TLS override is requested", () => {
  const url = "postgresql://test:test@localhost:55432/test";
  expect(databaseConnection(url, false)).toEqual({ connectionString: url });
});
it("requires certificate and hostname verification in serverless production", () => {
  const config = databaseConnection(
    "postgresql://test:test@db.example.test:6543/test?sslmode=disable&ssl=false",
    true,
  );
  expect(config.ssl).toEqual({ rejectUnauthorized: true });
  expect(new URL(config.connectionString).searchParams.has("sslmode")).toBe(false);
  expect(new URL(config.connectionString).searchParams.has("ssl")).toBe(false);
});
it("uses the configured CA even when a URI contains conflicting SSL parameters", () => {
  const config = databaseConnection(
    "postgresql://test:test@db.example.test/test?sslmode=require&sslrootcert=missing.crt&pgbouncer=true",
    true,
    "-----BEGIN CERTIFICATE-----\\nTEST\\n-----END CERTIFICATE-----",
  );
  expect(config.ssl).toEqual({
    rejectUnauthorized: true,
    ca: "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----",
  });
  const url = new URL(config.connectionString);
  expect(url.searchParams.has("sslrootcert")).toBe(false);
  expect(url.searchParams.get("pgbouncer")).toBe("true");
});
it("accepts multiline PEM certificates and enables verification outside Vercel too", () => {
  const certificate = "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----";
  expect(
    databaseConnection("postgresql://test:test@db.example.test/test", false, certificate).ssl,
  ).toEqual({ rejectUnauthorized: true, ca: certificate });
});
