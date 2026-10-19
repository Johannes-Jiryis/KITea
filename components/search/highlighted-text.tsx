// React escapes all fragments, including imported catalog content.
export const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  const words = query
    .trim()
    .split(/\s+/u)
    .filter((word) => word.length >= 2);
  if (!words.length) return <>{text}</>;
  const pattern = new RegExp(
    `(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "giu",
  );
  return (
    <>
      {text.split(pattern).map((part, index) =>
        index % 2 ? (
          <mark key={index} className="rounded-sm bg-primary/15 text-primary">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};
