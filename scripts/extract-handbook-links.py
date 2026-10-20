"""Extract explicit course-to-module links; never infer them from similar titles.

Requires pypdf==6.21.1. Usage: python scripts/extract-handbook-links.py handbook.pdf
The PDF is supplied by the operator and is not committed.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path


def extract(pages):
    courses = {}
    for page_number, text in enumerate(pages, 1):
        if not re.search(r"^5\s+TEILLEISTUNGEN\b", text, re.M) or "Bestandteil von:" not in text:
            continue
        # Only the explicit parent field, never prerequisite/recommendation references.
        parent_field = text.split("Bestandteil von:", 1)[1].split("Teilleistungsart", 1)[0]
        parents = sorted(set(re.findall(r"M-[A-Z]+-\d+", parent_field)))
        if not parents or "Lehrveranstaltungen" not in text:
            continue
        teaching = text.split("Lehrveranstaltungen", 1)[1]
        # Assessment event numbers are not teaching course identifiers.
        teaching = re.split(r"Pr\u00fcfungsveranstaltungen|Legende:|Erfolgskontrolle", teaching)[0]
        lines = teaching.splitlines()
        row_pattern = r"^\s*(SS\s+\d{4}|WS\s+\d{2}/\d{2})\s+(\d{7})\s+"
        for index, line in enumerate(lines):
            match = re.match(row_pattern, line)
            if not match:
                continue
            sws = re.search(r"\d+(?:[.,]\d+)?\s+SWS", line[match.end():])
            if not sws:
                # Retain uncertainty instead of silently making another occurrence look unique.
                term = " ".join(match[1].split())
                record = courses.setdefault(match[2], {"parents": set(), "pages": set(), "variants": {}})
                record["parents"].update(parents)
                record["pages"].add(page_number)
                variant = record["variants"].setdefault(("", term), {"parents": set(), "pages": set()})
                variant["parents"].update(parents)
                variant["pages"].add(page_number)
                continue
            title_end = match.end() + sws.start()
            title_parts = [line[match.end():title_end].strip()]
            for continuation in lines[index + 1:]:
                if re.match(row_pattern, continuation) or not continuation.strip():
                    break
                title_parts.append(continuation[match.end():title_end].strip())
            title = " ".join(part for part in title_parts if part)
            term = " ".join(match[1].split())
            record = courses.setdefault(match[2], {"parents": set(), "pages": set(), "variants": {}})
            record["parents"].update(parents)
            record["pages"].add(page_number)
            variant = record["variants"].setdefault((title, term), {"parents": set(), "pages": set()})
            variant["parents"].update(parents)
            variant["pages"].add(page_number)
    return [
        {"courseNumber": number, "moduleNumbers": sorted(row["parents"]), "pages": sorted(row["pages"]),
         "variants": [{"title": title, "term": term, "moduleNumbers": sorted(variant["parents"]),
                       "pages": sorted(variant["pages"])}
                      for (title, term), variant in sorted(row["variants"].items())]}
        for number, row in sorted(courses.items())
    ]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output", type=Path, default=Path("data/handbook-course-links.json"))
    args = parser.parse_args()
    from pypdf import PdfReader
    reader = PdfReader(args.pdf)
    pages = [page.extract_text(extraction_mode="layout") for page in reader.pages]
    links = extract(pages)
    date = re.search(r"\bStand(?: vom)?\s+(\d{2})\.(\d{2})\.(\d{4})", pages[0])
    if not date:
        raise ValueError("Handbook date could not be verified from its first page")
    result = {
        "source": {"file": args.pdf.name, "sha256": hashlib.sha256(args.pdf.read_bytes()).hexdigest(),
                   "handbookDate": f"{date[3]}-{date[2]}-{date[1]}", "pageCount": len(pages)},
        "links": links,
    }
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"courses": len(links), "unambiguous": sum(len(r['moduleNumbers']) == 1 for r in links)}))


if __name__ == "__main__":
    main()
