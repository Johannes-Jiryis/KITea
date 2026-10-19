const connectionCodes = new Set([
  "P1001",
  "P1002",
  "P1017",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "08000",
  "08001",
  "08003",
  "08006",
  "57P01",
]);

export const isDatabaseConnectionError = (error: unknown): boolean => {
  let current = error;
  const visited = new Set<unknown>();
  for (
    let depth = 0;
    depth < 6 && current && typeof current === "object" && !visited.has(current);
    depth++
  ) {
    visited.add(current);
    const value = current as { code?: unknown; message?: unknown; cause?: unknown };
    if (typeof value.code === "string" && connectionCodes.has(value.code)) return true;
    if (
      typeof value.message === "string" &&
      /connection terminated(?: unexpectedly| due to connection timeout)|timeout exceeded when trying to connect|can't reach database server|server closed the connection unexpectedly/i.test(
        value.message,
      )
    )
      return true;
    current = value.cause;
  }
  return false;
};

/** Only call with idempotent reads. Never replay a write or a mixed read/write transaction. */
export const databaseRead = async <T>(read: () => Promise<T>): Promise<T> => {
  try {
    return await read();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    console.warn(
      JSON.stringify({ level: "warn", event: "database.read.retry", reason: "connection_failure" }),
    );
    await new Promise((resolve) => setTimeout(resolve, 200));
    return read();
  }
};
