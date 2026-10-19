export const MAX_QUERY_LENGTH = 80;
export const normalizeSearchQuery = (query: string) =>
  query
    .normalize("NFKC")
    .replace(/\p{Cc}/gu, " ")
    .trim()
    .replace(/\s+/gu, " ")
    .slice(0, MAX_QUERY_LENGTH);
