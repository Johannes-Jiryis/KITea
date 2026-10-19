import { describe, expect, it } from "vitest";
import { moduleTitleIssue } from "../../scripts/lib/module-title";

describe("catalog metadata detection", () => {
  it.each([
    "Tue 17:00-18:30 Single on 01/20",
    "Wed 14:00-15:30 20.30 Seminarraum -1.013 (UG) from 10/29 until 02/18",
    "09:00–10:30 Single on 01/20",
    "🖥 Online",
    "Organizational topics",
    "Lecture (V)",
    "Tutorial (Tu)",
    "3.6.3. Sonstige Veranstaltungen",
    "through Trust, Respect and Contrubition",
  ])("recognizes metadata: %s", (title) => expect(moduleTitleIssue(title)).not.toBeNull());
  it.each([
    "Online Algorithms",
    "Single Cell Analysis",
    "Real-Time Systems",
    "3D Computer Vision",
    "Algebra",
    "Seminar (Statistik)",
    "Seminar (S)",
    "Practical Course: Advanced Topics in High Performance Computing, Data Management and Analytics",
  ])("preserves course titles: %s", (title) => expect(moduleTitleIssue(title)).toBeNull());
});
