"""Run with: python -m unittest discover -s tests -p test_handbook_links.py"""
import json
import runpy
import unittest
from pathlib import Path

extract = runpy.run_path("scripts/extract-handbook-links.py")["extract"]


class HandbookLinksTest(unittest.TestCase):
    def test_explicit_parents_only_and_no_assessment_event_numbers(self):
        page = """5 TEILLEISTUNGEN
Bestandteil von: M-INFO-106959 - Machine Learning
Teilleistungsart
Lehrveranstaltungen
 SS 2026 2400008 Machine Learning  2 SWS Lecture
Pr\u00fcfungsveranstaltungen
 SS 2026 7500149 Exam
Voraussetzungen M-INFO-999999
"""
        self.assertEqual(extract([page]), [
            {"courseNumber": "2400008", "moduleNumbers": ["M-INFO-106959"], "pages": [1],
             "variants": [{"title": "Machine Learning", "term": "SS 2026", "moduleNumbers": ["M-INFO-106959"], "pages": [1]}]}
        ])

    def test_shared_course_is_ambiguous_even_across_pages(self):
        def page(parent):
            return f"5 TEILLEISTUNGEN\nBestandteil von: {parent}\nTeilleistungsart\nLehrveranstaltungen\n WS 26/27 2400008 Title  2 SWS Lecture\nLegende:"
        rows = extract([page("M-INFO-106959"), "Wrapped heading\n" + page("M-INFO-107090")])
        self.assertEqual(rows[0]["moduleNumbers"], ["M-INFO-106959", "M-INFO-107090"])
        self.assertEqual(rows[0]["pages"], [1, 2])

    def test_real_handbook_examples_and_unique_course_identifiers(self):
        data = json.loads(Path("data/handbook-course-links.json").read_text(encoding="utf-8"))
        rows = {row["courseNumber"]: row for row in data["links"]}
        self.assertEqual(len(rows), len(data["links"]))
        self.assertEqual(rows["2400008"]["moduleNumbers"], ["M-INFO-106959"])
        self.assertEqual(rows["2400034"]["moduleNumbers"], ["M-INFO-106959"])
        self.assertEqual(rows["2400194"]["moduleNumbers"], ["M-INFO-107090", "M-INFO-107436"])
        summer = [v for v in rows["2400194"]["variants"] if v["term"] == "SS 2026"]
        self.assertEqual(summer[0]["moduleNumbers"], ["M-INFO-107090"])
        self.assertEqual(summer[0]["title"], "Sampling Methods for Machine Learning")
        self.assertEqual(rows["2400034"]["pages"], [800])
        self.assertEqual(data["source"]["pageCount"], 1189)


if __name__ == "__main__":
    unittest.main()
