/** Return a reason only for recognizable catalog metadata, not unfamiliar course titles. */
export const moduleTitleIssue = (raw: string): string | null => {
  const title = raw.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun|Mo|Di|Mi|Do|Fr|Sa|So)\.?\s+\d{1,2}:\d{2}\b/i.test(title)) {
    return "timetable row";
  }
  if (/^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}/.test(title)) return "time range";
  if (/^(?:🖥\s*)?Online$/iu.test(title)) return "location label";
  if (/^Organizational topics$/i.test(title)) return "administrative heading";
  if (/^(?:Lecture|Exercise|Practical|Tutorial)\s*\([A-Z]+\)$/i.test(title))
    return "course-type label";
  if (/^\d+(?:\.\d+)+\.\s/.test(title)) return "catalog section heading";
  if (/^(?:through Trust, Respect and Contrubition|Respect and Contribution)$/i.test(title)) {
    return "broken title fragment";
  }
  return null;
};
