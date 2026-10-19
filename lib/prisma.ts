import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { databaseConnection } from "@/lib/database/connection";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const getPrisma = () => {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing DATABASE_URL.");
  const serverless = process.env.VERCEL === "1";
  const adapter = new PrismaPg({
    ...databaseConnection(
      connectionString,
      serverless && process.env.NODE_ENV === "production",
      process.env.DATABASE_CA_CERT,
    ),
    max: serverless ? 1 : 5,
    // Remote poolers can take several seconds to establish a fresh connection.
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: serverless ? 5000 : 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    maxLifetimeSeconds: 300,
    statement_timeout: 5000,
    options: "-c timezone=UTC",
  });
  const client = new PrismaClient({
    adapter,
    log: [],
    transactionOptions: { maxWait: 3000, timeout: 8000 },
  });
  globalForPrisma.prisma = client;
  return client;
};
