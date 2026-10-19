/** Keep connection-string SSL flags from replacing the verified TLS configuration. */
export const databaseConnection = (
  connectionString: string,
  requireTls: boolean,
  certificate?: string,
) => {
  const ca = certificate?.trim().replace(/\\n/g, "\n");
  if (!requireTls && !ca) return { connectionString };
  const url = new URL(connectionString);
  for (const key of ["ssl", "sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"])
    url.searchParams.delete(key);
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  };
};
