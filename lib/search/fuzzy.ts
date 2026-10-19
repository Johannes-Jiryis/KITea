/**
 * Lightweight fuzzy matcher with typo tolerance (no external deps).
 * Returns a score in [0, 1]; 0 means no match.
 */
export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  if (!q || !t) return 0;
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.95;
  if (t.includes(q)) return 0.85 - Math.min(0.2, t.indexOf(q) / (t.length * 4));

  if (subsequenceMatch(q, t)) return 0.72;

  const distance = levenshtein(q, t);
  const maxLen = Math.max(q.length, t.length);
  const ratio = 1 - distance / maxLen;

  // Allow ~1 typo per 4 characters
  const threshold = 0.55 - Math.min(0.15, q.length * 0.02);
  return ratio >= threshold ? ratio * 0.9 : 0;
}

function subsequenceMatch(query: string, target: string): boolean {
  let qi = 0;
  for (let i = 0; i < target.length && qi < query.length; i++) {
    if (target[i] === query[qi]) qi++;
  }
  return qi === query.length;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

export function rankByFuzzy<T>(
  items: T[],
  query: string,
  keys: { name: keyof T; weight: number }[],
  limit = 8,
): { item: T; score: number }[] {
  const q = query.trim();
  if (!q) return [];

  const scored = items
    .map((item) => {
      let score = 0;
      for (const { name, weight } of keys) {
        const value = String(item[name] ?? "");
        score = Math.max(score, fuzzyScore(q, value) * weight);
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
