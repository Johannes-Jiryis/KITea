export function formatRating(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1);
}

export function difficultyLabel(value: number | null): string {
  if (value === null) return "No data";
  if (value <= 2) return "Easy";
  if (value <= 3.5) return "Medium";
  return "Hard";
}

export function difficultyColor(value: number | null): string {
  if (value === null) return "bg-muted-foreground/40";
  if (value <= 2) return "bg-emerald-500";
  if (value <= 3.5) return "bg-amber-500";
  return "bg-rose-500";
}
