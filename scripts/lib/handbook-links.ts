import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type HandbookLink = {
  courseNumber: string;
  moduleNumbers: string[];
  pages: number[];
  variants?: { title: string; term: string; moduleNumbers: string[]; pages: number[] }[];
};
export const handbookLinks: HandbookLink[] = JSON.parse(
  readFileSync(resolve("data/handbook-course-links.json"), "utf8"),
).links;

const normalizedTitle = (title: string) =>
  title
    .normalize("NFKC")
    .replace(/\u00ad/g, "")
    .toLocaleLowerCase("de-DE")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
export const sameCourseTitle = (a: string, b: string) => normalizedTitle(a) === normalizedTitle(b);
type Term = { name: string; year: number };
const termKey = (term: Term) =>
  term.name === "Sommersemester"
    ? `SS ${term.year}`
    : `WS ${String(term.year).slice(-2)}/${String(term.year + 1).slice(-2)}`;

export const matchingParents = (link: HandbookLink, title: string, semesters: Term[]) => {
  if (!link.variants) return link.moduleNumbers;
  const terms = new Set(semesters.map(termKey));
  if (link.variants.some((variant) => !variant.title && terms.has(variant.term))) return [];
  return [
    ...new Set(
      link.variants
        .filter(
          (variant) =>
            normalizedTitle(variant.title) === normalizedTitle(title) && terms.has(variant.term),
        )
        .flatMap((variant) => variant.moduleNumbers),
    ),
  ];
};

export const handbookParent = (courseNumber: string, title: string, semester: Term) => {
  const link = handbookLinks.find((row) => row.courseNumber === courseNumber);
  if (!link) return undefined;
  const parents = matchingParents(link, title, [semester]);
  return parents.length === 1 ? parents[0] : undefined;
};
