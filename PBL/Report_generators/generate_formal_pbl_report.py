"""
SafeHer Formal PBL Project Report generator.

Structure locked to:
  - PBL-Frontsheets.docx (prelims: title, Vision/Mission/PEOs, POs)
  - digital__.pdf chapter skeleton (Ch.1–10 + Bibliography + Appendices A–C)

No extra "B" chapters. Formatting: TNR 12, 1.5, justified; captions 10pt bold centered.
"""
from __future__ import annotations

import shutil
from copy import deepcopy
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, Twips

ROOT = Path(r"C:\aman\dataset for pbl")
FRONTSHEETS = ROOT / "PBL-Frontsheets.docx"
OUT = ROOT / "SafeHer_PBL_Formal_Project_Report.docx"
VIS = ROOT / "report-visuals"
SHOTS = ROOT / "WhatsApp Unknown 2026-07-23 at 12.40.32 AM"

TITLE = (
    "Incident Analysis and Hotspot Identification for "
    "Security Provision against Women Harassment in Public Spaces"
)
APP = "SafeHer"
STUDENTS = [("Aman Yadav", "1BY25MC012"), ("Anusha K", "1BY25MC017")]
GUIDE = "Dr. M.Sridevi"
DESIGNATION = "Faculty, Department of MCA"
DATE = "July-2026"

# Formatting_specification.docx + BMSIT norms
FONT = "Times New Roman"
BODY_SIZE = 12
CAPTION_SIZE = 10
H1_SIZE = 16
H2_SIZE = 14
FIRST_LINE_INDENT = Inches(0.5)


# ---------------------------------------------------------------------------
# Formatting helpers (college-accurate)
# ---------------------------------------------------------------------------

def set_run_font(run, size=BODY_SIZE, bold=False, italic=False, name=FONT):
    """Force Times New Roman on ascii/hAnsi/cs/eastAsia so Word does not substitute."""
    run.font.name = name
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), name)
    rFonts.set(qn("w:hAnsi"), name)
    rFonts.set(qn("w:cs"), name)
    rFonts.set(qn("w:eastAsia"), name)
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic


def apply_document_defaults(doc: Document):
    """Normal style = TNR 12, 1.5; keep A4 margins from frontsheets."""
    style = doc.styles["Normal"]
    style.font.name = FONT
    style.font.size = Pt(BODY_SIZE)
    rPr = style.element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    rFonts.set(qn("w:ascii"), FONT)
    rFonts.set(qn("w:hAnsi"), FONT)
    rFonts.set(qn("w:cs"), FONT)
    rFonts.set(qn("w:eastAsia"), FONT)
    pf = style.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_after = Pt(0)
    pf.space_before = Pt(0)

    for sec in doc.sections:
        # Margins: leave room OUTSIDE the page border for page numbers
        # Border sits ~0.55" from page edge; footer (~0.35") stays below bottom border.
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(0.85)
        sec.header_distance = Inches(0.4)
        sec.footer_distance = Inches(0.35)
        set_page_border(sec)
        add_page_number_footer(sec)


def set_page_border(section):
    """
    Black page border on all sides.
    offsetFrom=page; space is distance (points) from page edge to border.
    Bottom space > footer_distance so page numbers sit OUTSIDE the border.
    """
    sectPr = section._sectPr
    # Remove existing pgBorders if any
    for child in list(sectPr):
        if child.tag == qn("w:pgBorders"):
            sectPr.remove(child)

    pgBorders = OxmlElement("w:pgBorders")
    pgBorders.set(qn("w:offsetFrom"), "page")
    # space: points from page edge. Bottom=46pt (~0.64") so footer at 0.35" is outside.
    borders = {
        "top": "36",
        "left": "36",
        "bottom": "46",
        "right": "36",
    }
    for edge, space in borders.items():
        el = OxmlElement(f"w:{edge}")
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "12")  # 1.5 pt
        el.set(qn("w:space"), space)
        el.set(qn("w:color"), "000000")
        pgBorders.append(el)
    sectPr.append(pgBorders)


def add_page_number_footer(section):
    """Page number centered in footer — physically outside (below) the page border."""
    footer = section.footer
    footer.is_linked_to_previous = False
    # Clear existing footer content
    if footer.paragraphs:
        p = footer.paragraphs[0]
        for r in list(p.runs):
            r._element.getparent().remove(r._element)
        # remove extra paragraphs
        for extra in list(footer.paragraphs[1:]):
            extra._element.getparent().remove(extra._element)
    else:
        p = footer.add_paragraph()

    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE

    run = p.add_run()
    set_run_font(run, size=11, bold=False)

    fld_char_begin = OxmlElement("w:fldChar")
    fld_char_begin.set(qn("w:fldCharType"), "begin")

    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "

    fld_char_separate = OxmlElement("w:fldChar")
    fld_char_separate.set(qn("w:fldCharType"), "separate")

    fld_char_end = OxmlElement("w:fldChar")
    fld_char_end.set(qn("w:fldCharType"), "end")

    run._r.append(fld_char_begin)
    run._r.append(instr)
    run._r.append(fld_char_separate)
    # placeholder shown before field update
    placeholder = OxmlElement("w:t")
    placeholder.text = "1"
    run._r.append(placeholder)
    run._r.append(fld_char_end)


def add_para(
    doc,
    text,
    *,
    size=BODY_SIZE,
    bold=False,
    italic=False,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    space_after=0,
    space_before=0,
    first_line_indent=None,
    line_spacing=1.5,
):
    p = doc.add_paragraph()
    p.style = doc.styles["Normal"]
    p.alignment = align
    pf = p.paragraph_format
    if line_spacing == 1.5:
        pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    elif line_spacing == 1.0:
        pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    else:
        pf.line_spacing = line_spacing
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    if first_line_indent is not None:
        pf.first_line_indent = first_line_indent
    else:
        pf.first_line_indent = Pt(0)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold, italic=italic)
    return p


def h1(doc, text):
    """Chapter / major heading: 16pt Bold Center, TNR."""
    return add_para(
        doc, text, size=H1_SIZE, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=12, space_after=12, first_line_indent=Pt(0),
    )


def h2(doc, text):
    """Section heading: 14pt Bold Left (e.g. 1.1 Project Description)."""
    return add_para(
        doc, text, size=H2_SIZE, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=12, space_after=6, first_line_indent=Pt(0),
    )


def h3(doc, text):
    """Subsection: 12pt Bold Left."""
    return add_para(
        doc, text, size=BODY_SIZE, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=10, space_after=4, first_line_indent=Pt(0),
    )


def body(doc, text):
    """Body: TNR 12, 1.5, justified, first-line indent 0.5\"."""
    return add_para(
        doc, text, size=BODY_SIZE, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
        space_after=0, space_before=0, first_line_indent=FIRST_LINE_INDENT,
    )


def bullets(doc, items):
    for item in items:
        add_para(
            doc, "• " + item, size=BODY_SIZE, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_after=0, space_before=0, first_line_indent=FIRST_LINE_INDENT,
        )


def numbered(doc, items):
    for i, item in enumerate(items, 1):
        add_para(
            doc, f"{i}. {item}", size=BODY_SIZE, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
            space_after=0, space_before=0, first_line_indent=FIRST_LINE_INDENT,
        )


def caption_fig(doc, text):
    """Fig. X.Y: ... — 10pt TNR Bold Centered, below figure (Formatting_specification)."""
    return add_para(
        doc, text, size=CAPTION_SIZE, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=6, space_after=12, first_line_indent=Pt(0),
    )


def caption_table(doc, text):
    """Table X.Y: ... — 10pt TNR Bold Centered, above table."""
    return add_para(
        doc, text, size=CAPTION_SIZE, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=12, space_after=6, first_line_indent=Pt(0),
    )


def page_break(doc):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    run = p.add_run()
    run.add_break(WD_BREAK.PAGE)


def add_toc_line(doc, title: str, page: str, *, indent_in=0.0, bold=False):
    """TOC / LOF / LOT line with dotted leader to right-aligned page number."""
    p = doc.add_paragraph()
    p.style = doc.styles["Normal"]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf = p.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_before = Pt(0)
    pf.space_after = Pt(0)
    pf.first_line_indent = Pt(0)
    pf.left_indent = Inches(indent_in)
    # Right tab near usable page width (A4 ~8.27", L1"+R0.8" => ~6.4" content)
    pf.tab_stops.add_tab_stop(
        Inches(6.3), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS
    )
    run = p.add_run(title)
    set_run_font(run, size=BODY_SIZE, bold=bold)
    run2 = p.add_run("\t" + page)
    set_run_font(run2, size=BODY_SIZE, bold=False)
    return p


def shade_cell(cell, fill="D9D9D9"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell(cell, text, *, bold=False, size=CAPTION_SIZE, center=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
    p.paragraph_format.first_line_indent = Pt(0)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)


def add_table(doc, headers, rows, caption=None):
    if caption:
        caption_table(doc, caption)
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    table.autofit = True
    for i, h in enumerate(headers):
        set_cell(table.rows[0].cells[i], h, bold=True, size=CAPTION_SIZE, center=True)
        shade_cell(table.rows[0].cells[i])
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            set_cell(table.rows[r_i + 1].cells[c_i], str(val), size=CAPTION_SIZE)
    # spacer after table
    add_para(doc, "", size=BODY_SIZE, space_after=6, first_line_indent=Pt(0))
    return table


def add_figure(doc, path: Path, caption: str, width_in=5.5):
    if not path.exists():
        body(doc, f"[Figure missing: {path.name}]")
        caption_fig(doc, caption)
        return
    p = doc.add_paragraph()
    p.style = doc.styles["Normal"]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.space_before = Pt(6)
    pf.space_after = Pt(0)
    pf.first_line_indent = Pt(0)
    pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
    run = p.add_run()
    run.add_picture(str(path), width=Inches(width_in))
    caption_fig(doc, caption)


def add_code_block(doc, lines: str):
    for line in lines.strip("\n").splitlines():
        p = doc.add_paragraph()
        p.style = doc.styles["Normal"]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        pf = p.paragraph_format
        pf.line_spacing_rule = WD_LINE_SPACING.SINGLE
        pf.space_after = Pt(0)
        pf.space_before = Pt(0)
        pf.first_line_indent = Pt(0)
        pf.left_indent = Inches(0.25)
        run = p.add_run(line if line else " ")
        set_run_font(run, size=9, name="Courier New")


def replace_para_text(paragraph, new_text, *, bold=None, size=None, center=False):
    """Replace all runs in a paragraph with a single run of new_text."""
    for r in paragraph.runs:
        r.text = ""
    if paragraph.runs:
        run = paragraph.runs[0]
        run.text = new_text
    else:
        run = paragraph.add_run(new_text)
    set_run_font(run, size=size or BODY_SIZE, bold=bool(bold))
    if center:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER


def clear_from_abstract(doc: Document):
    """Remove body elements starting at the ABSTRACT heading onward."""
    start_idx = None
    for i, p in enumerate(doc.paragraphs):
        if p.text.strip().upper() == "ABSTRACT":
            start_idx = i
            break
    if start_idx is None:
        raise RuntimeError("ABSTRACT heading not found in frontsheets")

    # Collect XML elements to remove: from ABSTRACT para through end of body
    # (except sectPr at the end)
    body_el = doc.element.body
    children = list(body_el)
    # Map paragraph to element; find ABSTRACT element
    abs_el = doc.paragraphs[start_idx]._element
    removing = False
    to_remove = []
    for child in children:
        if child is abs_el:
            removing = True
        if removing:
            # Keep final sectPr
            if child.tag == qn("w:sectPr"):
                continue
            to_remove.append(child)
    for child in to_remove:
        body_el.remove(child)


# ---------------------------------------------------------------------------
# Frontsheets fill
# ---------------------------------------------------------------------------

def fill_title_page(doc: Document):
    # Para indices from inspection of PBL-Frontsheets.docx
    mapping = {
        2: TITLE,
        8: f"{STUDENTS[0][0]}                        {STUDENTS[1][0]}",
        9: f"{STUDENTS[0][1]}                        {STUDENTS[1][1]}",
        13: GUIDE,
        14: DESIGNATION,
    }
    for idx, text in mapping.items():
        if idx < len(doc.paragraphs):
            p = doc.paragraphs[idx]
            bold = idx in (2, 8, 9, 13)
            replace_para_text(p, text, bold=bold, size=14 if idx == 2 else 12, center=True)

    # Also try to fill any remaining NAME/USN placeholders if structure differs
    for p in doc.paragraphs[:20]:
        t = p.text.strip()
        if t == "NAME" or t == "NAME ":
            replace_para_text(
                p,
                f"{STUDENTS[0][0]}                        {STUDENTS[1][0]}",
                bold=True, size=12, center=True,
            )
        elif t == "USN" or t == "USN ":
            replace_para_text(
                p,
                f"{STUDENTS[0][1]}                        {STUDENTS[1][1]}",
                bold=True, size=12, center=True,
            )
        elif t == "Faculty Name":
            replace_para_text(p, GUIDE, bold=True, size=12, center=True)
        elif t.strip() == "Designation":
            replace_para_text(p, DESIGNATION, bold=False, size=12, center=True)
        elif "Title of the Project" in t:
            replace_para_text(p, TITLE, bold=True, size=14, center=True)


# ---------------------------------------------------------------------------
# Document body
# ---------------------------------------------------------------------------

def write_abstract_and_lists(doc: Document):
    h1(doc, "ABSTRACT")
    body(
        doc,
        "Women’s sense of safety on urban streets is shaped by lighting, crowd presence, "
        "surveillance, and proximity to emergency services, yet these signals are rarely "
        "available as a single, actionable map for citizens. This Project Based Learning "
        f"(PBL) work presents {APP}, a dual-channel data-collection system for Bengaluru: "
        "an OpenStreetMap (OSM)–derived street safety baseline covering approximately "
        "46,424 streets across 53 Bruhat Bengaluru Mahanagara Palike (BBMP) areas, and a "
        "live crowdsourcing platform through which women can anonymously mark how a place "
        "feels or report an incident with GPS context.",
    )
    body(
        doc,
        f"The deliverables include an Expo/React Native mobile application ({APP}) with "
        "Home, Report, Map, and Emergency SOS tabs; a Next.js public website for browser-"
        "based reporting, community map, and helplines; a password-protected admin portal "
        "for OSM key performance indicators and Generated-versus-Real community monitoring; "
        "and a Supabase PostgreSQL schema with row-level security for anonymous inserts and "
        "approved-report reads. Street scores use a transparent nine-factor weighted model "
        "(police, hospital, bus stops, lighting, CCTV, crowd proxies, commercial activity, "
        "night amenity, and road class) classified into Safe, Moderate, and Unsafe bands.",
    )
    body(
        doc,
        "This report documents Phase-1 completion of data collection and platform "
        "demonstration. Finished exploratory data analysis, unsupervised hotspot clustering "
        "(for example K-Means), and production-grade predictive policing dashboards remain "
        "explicit future work and are not claimed as completed outcomes.",
    )
    add_para(
        doc,
        "Keywords: Women’s street safety, OpenStreetMap, Crowdsourcing, SafeHer, BBMP, "
        "Supabase, Expo, Next.js, Bengaluru, Anonymous reporting",
        size=BODY_SIZE, bold=True, align=WD_ALIGN_PARAGRAPH.JUSTIFY,
        space_before=12, space_after=0, first_line_indent=FIRST_LINE_INDENT,
    )

    page_break(doc)
    h1(doc, "TABLE OF CONTENTS")
    toc_rows = [
        ("ABSTRACT", "i", 0.0, True),
        ("LIST OF FIGURES", "iii", 0.0, True),
        ("LIST OF TABLES", "iv", 0.0, True),
        ("CHAPTER 1: INTRODUCTION", "1", 0.0, True),
        ("1.1 Project Description", "1", 0.25, False),
        ("1.2 Background", "2", 0.25, False),
        ("1.3 Motivation", "2", 0.25, False),
        ("1.4 Problem Statement", "3", 0.25, False),
        ("CHAPTER 2: LITERATURE SURVEY", "4", 0.0, True),
        ("2.1 Background Study", "4", 0.25, False),
        ("2.2 Existing System", "4", 0.25, False),
        ("2.3 Limitations of Existing System", "5", 0.25, False),
        ("2.4 Proposed System", "5", 0.25, False),
        ("2.5 Advantages of Proposed System", "5", 0.25, False),
        ("2.6 Feasibility Study", "6", 0.25, False),
        ("2.7 Tools and Technologies Used", "7", 0.25, False),
        ("2.8 Hardware and Software Requirements", "7", 0.25, False),
        ("CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION", "8", 0.0, True),
        ("CHAPTER 4: SYSTEM DESIGN", "12", 0.0, True),
        ("CHAPTER 5: DETAILED DESIGN", "15", 0.0, True),
        ("CHAPTER 6: IMPLEMENTATION", "18", 0.0, True),
        ("CHAPTER 7: SOFTWARE TESTING", "28", 0.0, True),
        ("CHAPTER 8: RESULTS AND DISCUSSION", "30", 0.0, True),
        ("CHAPTER 9: CONCLUSION", "32", 0.0, True),
        ("CHAPTER 10: FUTURE ENHANCEMENTS", "33", 0.0, True),
        ("BIBLIOGRAPHY / REFERENCES", "34", 0.0, True),
        ("APPENDIX A: SUSTAINABLE DEVELOPMENT GOALS (SDG)", "36", 0.0, True),
        ("APPENDIX B: PROJECT SYNOPSIS", "37", 0.0, True),
        ("APPENDIX C: PLAGIARISM REPORT", "40", 0.0, True),
    ]
    for name, page, indent, bold in toc_rows:
        add_toc_line(doc, name, page, indent_in=indent, bold=bold)

    page_break(doc)
    h1(doc, "LIST OF FIGURES")
    figs = [
        ("Fig. 2.1", "Existing systems versus proposed SafeHer approach", "5"),
        ("Fig. 4.1", "High-level system architecture of SafeHer", "12"),
        ("Fig. 4.2", "System context diagram", "13"),
        ("Fig. 5.1", "Data flow diagram – Level 0", "15"),
        ("Fig. 5.2", "Data flow diagram – Level 1", "16"),
        ("Fig. 5.3", "Use case diagram", "16"),
        ("Fig. 5.4", "Activity diagram – Emergency SOS flow", "17"),
        ("Fig. 5.5", "Sequence diagram – anonymous report submission", "17"),
        ("Fig. 6.1", "SafeHer Home – area status and call to report", "20"),
        ("Fig. 6.2", "SafeHer Home – how it works and community summary", "21"),
        ("Fig. 6.3", "Report wizard – Step 1 location confirmation", "21"),
        ("Fig. 6.4", "Report wizard – Step 2 feeling or incident choice", "22"),
        ("Fig. 6.5", "Report wizard – incident type selection", "22"),
        ("Fig. 6.6", "Report wizard – optional details and factors", "23"),
        ("Fig. 6.7", "Report submission success screen", "23"),
        ("Fig. 6.8", "Safety Map with filters and community pins", "24"),
        ("Fig. 6.9", "Emergency SOS – call and live location share", "24"),
        ("Fig. 6.10", "Emergency SOS – helpline directory", "25"),
    ]
    for num, cap, page in figs:
        add_toc_line(doc, f"{num}: {cap}", page)

    page_break(doc)
    h1(doc, "LIST OF TABLES")
    tables = [
        ("Table 2.1", "Hardware and Software Requirements", "7"),
        ("Table 3.1", "Functional Requirements", "9"),
        ("Table 3.2", "Non-Functional Requirements", "10"),
        ("Table 6.1", "OSM safety scoring factor weights", "18"),
        ("Table 6.2", "Bengaluru OSM dataset summary metrics", "19"),
        ("Table 7.1", "Test Cases and Results", "28"),
    ]
    for num, cap, page in tables:
        add_toc_line(doc, f"{num}: {cap}", page)


def write_chapter_1(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 1: INTRODUCTION")

    h2(doc, "1.1 Project Description")
    body(
        doc,
        f"This PBL project designs and implements {APP}, a practical platform that combines "
        "an offline OSM infrastructure baseline with online citizen reporting for women’s "
        "street safety in Bengaluru. The OSM pipeline queries Overpass for highway geometries "
        "and nearby points of interest inside each of 53 BBMP area bounding boxes, then "
        "computes a per-street safety score. The live platform lets a user confirm GPS-derived "
        "locality, choose whether the place feels safe or unsafe (or that an incident occurred), "
        "optionally attach environmental factors, and store the report anonymously.",
    )
    body(
        doc,
        "Citizens interact through a mobile application (primary channel for GPS and SOS) and "
        "a public website (browser fallback without installation). Project staff monitor OSM "
        "coverage and incoming community signals through an admin portal. The present phase "
        "emphasises trustworthy data collection and usable interfaces rather than final "
        "statistical hotspot products.",
    )

    h2(doc, "1.2 Background")
    body(
        doc,
        "Urban safety research consistently shows that risk and fear of crime concentrate in "
        "particular places and times rather than spreading evenly across a city. Official "
        "crime registers capture only reported events and often lack fine-grained street "
        "context. Volunteered geographic information such as OpenStreetMap encodes lighting "
        "hints, transport stops, and amenity locations that can serve as environmental "
        "proxies. Parallel to this, crowdsourcing platforms demonstrate that residents can "
        "contribute experiential safety ratings when privacy and interaction cost are handled "
        "carefully.",
    )
    body(
        doc,
        "Bengaluru’s BBMP wards provide a natural administrative partitioning for both "
        "dataset generation and on-device area labelling. Matching GPS coordinates to a named "
        "ward gives users a recognisable place label without exposing a continuous tracking "
        "profile.",
    )

    h2(doc, "1.3 Motivation")
    body(doc, "Three gaps motivated this work:")
    bullets(
        doc,
        [
            "Emergency-only apps help after a crisis but do not accumulate place-level safety memory for route planning.",
            "OSM notebooks alone do not give women a simple way to contribute lived experience back into a shared map.",
            "Closed civic datasets are hard for student teams to refresh; an open OSM baseline plus anonymous reports is reproducible within a PBL timeline.",
        ],
    )
    body(
        doc,
        f"{APP} therefore pairs a transparent scored street dataset with lightweight "
        "reporting and SOS tools so that Phase-1 yields both reusable data and a working "
        "demonstration for stakeholders.",
    )

    h2(doc, "1.4 Problem Statement")
    body(
        doc,
        "To design and implement a Phase-1 data-collection system that can:",
    )
    bullets(
        doc,
        [
            "Extract OSM street and amenity attributes for Bengaluru BBMP areas and publish a scored street safety dataset.",
            "Enable anonymous GPS-linked safe / unsafe / incident reporting on mobile and web.",
            "Visualise community marks on an OpenStreetMap-based map with filters.",
            "Provide SOS helplines and location sharing for emergency assistance.",
            "Offer an admin view of OSM metrics alongside Generated (demo) and Real (live) community signals.",
            "Defer finished EDA, unsupervised hotspot clustering, and predictive policing claims to later phases.",
        ],
    )


def write_chapter_2(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 2: LITERATURE SURVEY")

    h2(doc, "2.1 Background Study")
    body(
        doc,
        "GIS-based crime mapping literature (for example Chainey and Ratcliffe) establishes "
        "methods for visualising concentration of events and identifying hotspots. "
        "Environmental criminology links guardianship, lighting, and land use to both "
        "opportunity and fear. OpenStreetMap has become a standard volunteered geographic "
        "source for urban analytics when official spatial layers are incomplete or delayed. "
        "Crowdsourced safety audits, popularised by tools such as Safetipin, show that "
        "citizen ratings can complement police statistics by capturing perceived safety.",
    )

    h2(doc, "2.2 Existing System")
    bullets(
        doc,
        [
            "Personal safety apps (for example bSafe-style products) emphasise SOS alerts, trusted contacts, and audio/video evidence rather than city-scale street scoring.",
            "Standalone GIS notebooks or civic dashboards may score environments offline but lack a live anonymous reporting channel for women in the field.",
            "Official complaint portals record incidents after the fact and rarely expose interactive community maps for everyday route decisions.",
        ],
    )

    h2(doc, "2.3 Limitations of Existing System")
    bullets(
        doc,
        [
            "Emergency features without a accumulating spatial dataset leave little memory for others planning the same street later.",
            "Offline OSM analyses without a product front-end are inaccessible to non-technical citizens.",
            "Systems that require strong identity for every report raise privacy concerns for harassment-related disclosures.",
            "Closed proprietary safety scores are difficult to audit or reproduce in academic PBL settings.",
        ],
    )

    h2(doc, "2.4 Proposed System")
    body(
        doc,
        f"The proposed {APP} system addresses these limitations by combining: (i) a "
        "reproducible OSM multi-factor street score for Bengaluru BBMP boxes; (ii) anonymous "
        "feeling and incident reports with rate limiting; (iii) mobile and web clients sharing "
        "one backend; (iv) SOS helplines and location share; and (v) an admin portal that "
        "separates Generated demonstration data from Real submissions so analysts do not "
        "confuse the two.",
    )
    add_figure(
        doc,
        VIS / "fig2_1_existing_vs_proposed.png",
        "Fig. 2.1: Existing systems versus proposed SafeHer approach",
    )

    h2(doc, "2.5 Advantages of Proposed System")
    bullets(
        doc,
        [
            "Transparent nine-factor scoring that can be explained to faculty and civic partners.",
            "Dual client (mobile + web) lowers the barrier for users who cannot install an APK.",
            "Anonymous inserts with approved-only public reads balance contribution and moderation policy.",
            "Admin Generated-versus-Real labelling supports honest evaluation during demos.",
            "SOS and map features give immediate user value while the long-term dataset grows.",
        ],
    )

    h2(doc, "2.6 Feasibility Study")
    h3(doc, "2.6.1 Technical Feasibility")
    body(
        doc,
        "The stack relies on mature open tools: Python with Overpass and pandas for dataset "
        "generation; Expo and React Native for Android builds; Next.js for the web portal; "
        "and Supabase (PostgreSQL + Row Level Security) for storage. All components run on "
        "standard student hardware and free-tier cloud resources, confirming technical "
        "feasibility for a PBL prototype.",
    )
    h3(doc, "2.6.2 Operational Feasibility")
    body(
        doc,
        "Citizens need only location permission and a few taps to contribute. Administrators "
        "use a password session to view dashboards. No hospital or police system integration "
        "is required for Phase 1, keeping operations within the student team’s control.",
    )
    h3(doc, "2.6.3 Economic Feasibility")
    body(
        doc,
        "OSM data, Expo tooling, Next.js, and Supabase free tiers avoid licensed datasets "
        "and paid map SDKs for the prototype stage. Development cost is therefore limited to "
        "time and commodity devices, which is economically feasible for academic work.",
    )

    h2(doc, "2.7 Tools and Technologies Used")
    bullets(
        doc,
        [
            "Programming: Python 3.x, TypeScript / JavaScript",
            "Mobile: Expo (~54), Expo Router, React Native, AsyncStorage",
            "Web: Next.js 16 (App Router), React 19, Tailwind CSS, Leaflet / react-leaflet, Recharts",
            "Backend: Supabase (PostgreSQL, RLS, RPC), anonymous client key",
            "Data: Overpass API, pandas, Excel/JSON street exports",
            "Maps: OpenStreetMap tiles in WebView (mobile) and Leaflet (web)",
        ],
    )

    h2(doc, "2.8 Hardware and Software Requirements")
    add_table(
        doc,
        ["Category", "Requirement"],
        [
            ["Processor", "Intel i5 / AMD Ryzen 5 or higher (development)"],
            ["RAM", "8 GB minimum (16 GB recommended for dataset builds)"],
            ["Storage", "5 GB free for Node modules, Android SDK, and dataset files"],
            ["Operating System", "Windows 10/11 (team development); Android 10+ for field tests"],
            ["Software", "Node.js 20+, Python 3.10+, Expo CLI / EAS, Android Studio SDK"],
            ["Cloud", "Supabase project; optional Vercel hosting for web"],
            ["Libraries", "pandas, requests, @supabase/supabase-js, Leaflet, Recharts"],
        ],
        caption="Table 2.1: Hardware and Software Requirements",
    )


def write_chapter_3(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 3: SOFTWARE REQUIREMENTS SPECIFICATION")

    h2(doc, "3.1 Users / User Roles")
    bullets(
        doc,
        [
            "Citizen / woman traveller — reports feelings or incidents, views the community map, uses SOS.",
            "Admin / project researcher — authenticates to the admin portal for OSM KPIs and community analytics.",
            "Developer / student team — maintains dataset scripts, schema, and client applications.",
        ],
    )

    h2(doc, "3.1.1 Objectives")
    numbered(
        doc,
        [
            "Build an OSM extraction and scoring pipeline for Bengaluru BBMP bounding boxes.",
            "Publish a reusable scored street dataset (Excel and JSON) with Safe / Moderate / Unsafe labels.",
            "Implement SafeHer mobile tabs for Home, Report, Map, and SOS.",
            "Implement SafeHer web routes for reporting, map, emergency, and community summary.",
            "Persist anonymous reports in Supabase with area labels and basic rate limiting.",
            "Provide an admin portal separating Generated demo data from Real live reports.",
            "Document Phase-1 limits honestly: EDA and hotspot clustering are out of scope for completion claims.",
        ],
    )
    body(
        doc,
        "Scope: Phase 1 is a single-team prototype for data collection and platform "
        "demonstration. It does not include production citizen authentication, hospital "
        "information-system integration, finished unsupervised hotspot products, or "
        "city-wide operational deployment.",
    )

    h2(doc, "3.2 Assumptions and Dependencies")
    h3(doc, "3.2.1 Assumptions")
    bullets(
        doc,
        [
            "Users grant location permission when reporting or using SOS.",
            "OSM coverage in Bengaluru is sufficient for a meaningful infrastructure baseline.",
            "Anonymous reporting with device-level rate limits is acceptable for the prototype ethics posture.",
            "Admin password in environment configuration is adequate for academic demonstration (not enterprise IAM).",
        ],
    )
    h3(doc, "3.2.2 Dependencies")
    bullets(
        doc,
        [
            "Overpass API availability for dataset regeneration.",
            "Supabase project reachability and anon key configuration in mobile/web clients.",
            "OpenStreetMap tile service for map rendering.",
            "Android device or emulator for Expo field tests; modern browser for web tests.",
        ],
    )

    h2(doc, "3.3 Functional Requirements")
    add_table(
        doc,
        ["ID", "Requirement"],
        [
            ["FR1", "The system shall fetch OSM highways and POIs per BBMP bounding box and compute street safety scores."],
            ["FR2", "The system shall classify streets into Safe, Moderate, or Unsafe using documented thresholds."],
            ["FR3", "The mobile app shall resolve GPS to a BBMP area name for display and storage."],
            ["FR4", "The system shall accept anonymous safe / unsafe / incident reports with optional factors."],
            ["FR5", "The system shall store reports in Supabase and expose approved reports to community maps."],
            ["FR6", "The system shall rate-limit submissions per device to reduce spam (approximately five per hour)."],
            ["FR7", "The map shall filter pins by All / Safe / Unsafe / Incidents and show area context."],
            ["FR8", "The SOS module shall list helplines and support calling plus location sharing."],
            ["FR9", "The admin portal shall require a password session before dashboard access."],
            ["FR10", "The admin analytics view shall distinguish Generated (synthetic) from Real reports."],
            ["FR11", "The web site shall allow reporting and map use without citizen login."],
            ["FR12", "The community summary shall aggregate counts useful for Home and Community screens."],
        ],
        caption="Table 3.1: Functional Requirements",
    )

    h2(doc, "3.4 Non-Functional Requirements")
    add_table(
        doc,
        ["ID", "Requirement"],
        [
            ["NFR1", "Usability: report flow completable in under one minute for the minimal path."],
            ["NFR2", "Privacy: no citizen account; coordinates used for area naming, not public tracking profiles."],
            ["NFR3", "Security: RLS enforces insert rules and approved-only public reads; admin via HttpOnly-style session cookie."],
            ["NFR4", "Reliability: clients degrade gracefully when GPS or network is unavailable (refresh / retry messaging)."],
            ["NFR5", "Maintainability: shared BBMP area definitions between Python pipeline and TypeScript clients."],
            ["NFR6", "Performance: map should remain interactive for hundreds of community pins on mid-range phones."],
            ["NFR7", "Transparency: scoring weights and methodology visible in admin Methodology pages."],
            ["NFR8", "Portability: Android APK via Expo; web via modern Chromium/Firefox/Safari browsers."],
        ],
        caption="Table 3.2: Non-Functional Requirements",
    )


def write_chapter_4(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 4: SYSTEM DESIGN")

    h2(doc, "4.1 System Architecture")
    body(
        doc,
        f"{APP} follows a layered client–server design with an offline data-science component. "
        "Citizens use mobile or web clients. Both talk to Supabase for report writes and "
        "community reads. Static OSM-derived JSON under the web public data folder drives "
        "admin OSM dashboards. The Python Overpass pipeline regenerates the Excel/JSON "
        "baseline when needed.",
    )
    body(doc, "Major building blocks:")
    numbered(
        doc,
        [
            "OSM Dataset Pipeline — Overpass queries, nine-factor scoring, Excel/JSON export.",
            "Supabase Backend — reports table, area_safety view, community_summary RPC, RLS policies.",
            "Mobile Application — Expo tabs for Home, Report, Map (WebView Leaflet), SOS.",
            "Web User Portal — landing, report form, map, emergency, community dashboard.",
            "Web Admin Portal — password middleware, OSM KPIs, analytics, search, areas, methodology.",
        ],
    )
    add_figure(
        doc,
        VIS / "fig4_1_system_architecture.png",
        "Fig. 4.1: High-level system architecture of SafeHer",
    )

    h2(doc, "4.2 System Perspective")
    body(
        doc,
        "From a product perspective, SafeHer is a civic sensing tool: infrastructure scores "
        "supply a baseline where crowdsourced volume is still low, while live reports "
        "gradually enrich place-level knowledge. The admin perspective treats Generated "
        "demo pins as scaffolding for empty maps and Real pins as the measurement of "
        "field adoption. Analytical ML modules are intentionally outside the Phase-1 "
        "system boundary so that architecture remains honest about completed scope.",
    )

    h2(doc, "4.3 Context Diagram")
    body(
        doc,
        "External actors are the citizen, the administrator, OpenStreetMap/Overpass, "
        "Supabase cloud, and telephony/SMS/WhatsApp channels used during SOS. The SafeHer "
        "system sits at the centre, mediating map tiles, report persistence, and emergency "
        "deep links without requiring a citizen login.",
    )
    add_figure(
        doc,
        VIS / "fig4_2_context_diagram.png",
        "Fig. 4.2: System context diagram",
    )


def write_chapter_5(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 5: DETAILED DESIGN")

    h2(doc, "5.1 Data Flow Diagram – Level 0")
    body(
        doc,
        "At Level 0, citizens supply location and report choices; SafeHer persists approved "
        "community data and returns map/summary views. Administrators supply credentials and "
        "receive analytics. The offline pipeline consumes OSM and produces scored streets.",
    )
    add_figure(doc, VIS / "fig5_1_dfd_level0.png", "Fig. 5.1: Data flow diagram – Level 0")

    h2(doc, "5.2 Data Flow Diagram – Level 1")
    body(
        doc,
        "Level 1 expands internal processes: area matching, report validation and insert, "
        "community aggregation, OSM scoring, and admin session checks. Data stores include "
        "the reports table, static street JSON, and local trusted-contact preferences on device.",
    )
    add_figure(doc, VIS / "fig5_2_dfd_level1.png", "Fig. 5.2: Data flow diagram – Level 1")

    h2(doc, "5.3 Use Case Diagram")
    body(
        doc,
        "Primary use cases for the citizen are Confirm Location, Submit Feeling Report, "
        "Submit Incident Report, Browse Safety Map, Call Helpline, and Share Live Location. "
        "Administrator use cases include Login, View OSM Dashboard, Inspect Community "
        "Analytics, Search Streets/Areas, and Read Methodology.",
    )
    add_figure(doc, VIS / "fig5_3_use_case.png", "Fig. 5.3: Use case diagram")

    h2(doc, "5.4 Activity Diagram – Emergency SOS")
    body(
        doc,
        "The SOS activity begins when the user opens the Emergency tab, optionally refreshes "
        "GPS, chooses Call 112 and share, share-to-police SMS, or a specific helpline card. "
        "Live tracking can keep updating coordinates for repeated shares. Trusted contact "
        "numbers remain on-device storage only.",
    )
    add_figure(doc, VIS / "fig5_4_sos_activity.png", "Fig. 5.4: Activity diagram – Emergency SOS flow")

    h2(doc, "5.5 Sequence Diagram – Report Submission")
    body(
        doc,
        "The report sequence involves the mobile/web UI, area matcher, Supabase client, "
        "RLS policies, and optional community_summary refresh. After insert, the UI shows a "
        "thank-you state and offers navigation to the map or a new report.",
    )
    add_figure(
        doc,
        VIS / "fig5_5_sequence_report.png",
        "Fig. 5.5: Sequence diagram – anonymous report submission",
    )


def write_chapter_6(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 6: IMPLEMENTATION")

    h2(doc, "6.1 Implementation Methodology")
    body(
        doc,
        "Implementation followed an iterative full-stack approach organised into four "
        "workstreams: (1) OSM dataset pipeline and scoring validation; (2) Supabase schema, "
        "RLS, and RPC functions; (3) Expo mobile application; (4) Next.js user and admin "
        "portals. Shared BBMP bounding boxes in TypeScript/Python kept area names consistent "
        "across offline scoring and online GPS matching.",
    )

    h2(doc, "6.2 Dataset and Feature Description")
    body(
        doc,
        "Bengaluru is partitioned into 53 BBMP area boxes. For each box, the Python script "
        "queries Overpass for highway geometries and POIs (police, hospitals, bus stops, "
        "CCTV nodes, lamps, and related amenities). Distances and presence flags feed a "
        "weighted score. Thresholds map scores to Safe (≥ 7), Moderate (≥ 4), and Unsafe (< 4).",
    )
    add_table(
        doc,
        ["Factor", "Weight"],
        [
            ["Police proximity", "0.20"],
            ["Hospital proximity", "0.15"],
            ["Bus stop proximity", "0.15"],
            ["Lighting indicators", "0.15"],
            ["CCTV presence", "0.10"],
            ["Crowd / activity proxies", "0.10"],
            ["Commercial activity", "0.05"],
            ["Night amenity indicators", "0.05"],
            ["Road class", "0.05"],
        ],
        caption="Table 6.1: OSM safety scoring factor weights",
    )
    add_table(
        doc,
        ["Metric", "Value"],
        [
            ["Total streets scored", "46,424"],
            ["BBMP areas covered", "53"],
            ["Safe streets", "7,855"],
            ["Moderate streets", "33,431"],
            ["Unsafe streets", "5,138"],
            ["Average safety score", "5.78"],
            ["Dataset generation date", "2026-05-24"],
        ],
        caption="Table 6.2: Bengaluru OSM dataset summary metrics",
    )

    h2(doc, "6.3 Module-wise Implementation")
    h3(doc, "6.3.1 Mobile Application")
    body(
        doc,
        "The Expo Router tabs are Home (area verdict and CTAs), Report (multi-step wizard), "
        "Map (Leaflet HTML inside WebView with filters), and SOS (helplines, trusted contact, "
        "call and share helpers). Reports post to Supabase using the anon client; device "
        "identifiers support rate limiting without creating user accounts.",
    )
    h3(doc, "6.3.2 Web User Portal")
    body(
        doc,
        "Public routes under the user layout expose landing, report, map, emergency, and "
        "community pages. The community dashboard merges synthetic demonstration records with "
        "live approved reports and labels the mix so evaluators understand demo scaffolding.",
    )
    h3(doc, "6.3.3 Web Admin Portal")
    body(
        doc,
        "Admin login validates ADMIN_PASSWORD and sets a session cookie consumed by Next.js "
        "middleware. Dashboards read static OSM JSON for street KPIs and query Supabase for "
        "community analytics, search, and area views. A methodology page documents scoring.",
    )
    h3(doc, "6.3.4 Supabase Backend")
    body(
        doc,
        "The reports table stores latitude, longitude, area name, is_safe, rating, factor "
        "booleans, comment, time_of_day, device_id, status, report_kind (feeling or incident), "
        "and incident_type. RLS allows anonymous insert and public select of approved rows. "
        "RPCs provide community_summary and recent-device report counts.",
    )

    h2(doc, "6.4 Key Code Snippets")
    body(doc, "Illustrative weighted scoring (Python pipeline):")
    add_code_block(
        doc,
        """
weights = {
    "police": 0.20, "hospital": 0.15, "bus": 0.15,
    "lighting": 0.15, "cctv": 0.10, "crowd": 0.10,
    "commercial": 0.05, "night": 0.05, "road": 0.05,
}
score = sum(component(row, k) * w for k, w in weights.items())
level = "Safe" if score >= 7 else "Moderate" if score >= 4 else "Unsafe"
""",
    )
    body(doc, "Illustrative report insert contract (client):")
    add_code_block(
        doc,
        """
await supabase.from("reports").insert({
  lat, lon, area_name, is_safe, rating,
  report_kind, incident_type, device_id, status: "approved",
});
""",
    )

    h2(doc, "6.5 Screenshots")
    body(
        doc,
        "The following figures are field captures of the SafeHer Android build exercising "
        "Home, Report, Map, and Emergency SOS flows.",
    )

    shots = [
        ("WhatsApp Image 2026-07-23 at 12.15.49 AM.jpeg",
         "Fig. 6.1: SafeHer Home – area status and call to report"),
        ("WhatsApp Image 2026-07-23 at 12.15.49 AM (1).jpeg",
         "Fig. 6.2: SafeHer Home – how it works and community summary"),
        ("WhatsApp Image 2026-07-23 at 12.15.50 AM.jpeg",
         "Fig. 6.3: Report wizard – Step 1 location confirmation"),
        ("WhatsApp Image 2026-07-23 at 12.15.50 AM (1).jpeg",
         "Fig. 6.4: Report wizard – Step 2 feeling or incident choice"),
        ("WhatsApp Image 2026-07-23 at 12.15.50 AM (2).jpeg",
         "Fig. 6.5: Report wizard – incident type selection"),
        ("WhatsApp Image 2026-07-23 at 12.15.51 AM.jpeg",
         "Fig. 6.6: Report wizard – optional details and factors"),
        ("WhatsApp Image 2026-07-23 at 12.15.51 AM (1).jpeg",
         "Fig. 6.7: Report submission success screen"),
        ("WhatsApp Image 2026-07-23 at 12.15.51 AM (2).jpeg",
         "Fig. 6.8: Safety Map with filters and community pins"),
        ("WhatsApp Image 2026-07-23 at 12.15.52 AM.jpeg",
         "Fig. 6.9: Emergency SOS – call and live location share"),
        ("WhatsApp Image 2026-07-23 at 12.15.52 AM (1).jpeg",
         "Fig. 6.10: Emergency SOS – helpline directory"),
    ]
    for fname, cap in shots:
        # Phone screenshots: readable on A4 while staying portrait-friendly
        add_figure(doc, SHOTS / fname, cap, width_in=3.6)


def write_chapter_7(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 7: SOFTWARE TESTING")

    h2(doc, "7.1 Testing Methodology")
    body(
        doc,
        "Testing combined manual functional checks on Android devices, browser smoke tests "
        "for the web portal, SQL verification of RLS behaviour, and scripted validation of "
        "scoring consistency between Python and TypeScript helpers. Emphasis was on critical "
        "user journeys: report submission, map filters, SOS dial/share, and admin auth gates.",
    )

    h2(doc, "7.2 Unit Testing")
    body(
        doc,
        "Unit-level checks covered BBMP point-in-bbox area matching, safety level thresholds, "
        "and scoring weight totals. Dataset conversion scripts were validated by comparing "
        "summary counts in Excel against generated JSON summary files used by the admin UI.",
    )

    h2(doc, "7.3 Test Cases and Results")
    add_table(
        doc,
        ["TC ID", "Test Case", "Expected Result", "Status"],
        [
            ["TC01", "GPS resolves to a BBMP area name on Home", "Named area shown (or clear empty state)", "Pass"],
            ["TC02", "Submit minimal safe report without details", "Thank-you screen; row in Supabase", "Pass"],
            ["TC03", "Submit incident with type Harassment", "Stored with report_kind=incident", "Pass"],
            ["TC04", "Map filter Unsafe hides safe pins", "Only unsafe/incident-relevant pins remain", "Pass"],
            ["TC05", "SOS Call 112 opens dialer", "tel: intent launched", "Pass"],
            ["TC06", "Share location composes SMS/Maps link", "Share sheet or SMS with coordinates", "Pass"],
            ["TC07", "Admin without cookie blocked from /admin/dashboard", "Redirect to login", "Pass"],
            ["TC08", "Admin with valid password reaches dashboard", "OSM KPIs visible", "Pass"],
            ["TC09", "Rate limit after repeated inserts", "Further inserts rejected by RPC/policy", "Pass"],
            ["TC10", "Public select cannot read pending/rejected rows", "Only approved visible on map APIs", "Pass"],
        ],
        caption="Table 7.1: Test Cases and Results",
    )


def write_chapter_8(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 8: RESULTS AND DISCUSSION")

    h2(doc, "8.1 Deliverables Achieved")
    body(
        doc,
        "Phase 1 produced a complete data-collection stack: a scored OSM street corpus for "
        "Bengaluru BBMP areas; working SafeHer mobile and web clients; Supabase persistence "
        "with privacy-minded RLS; and an admin portal for monitoring. Field screenshots in "
        "Chapter 6 confirm that the report wizard, map filters, and SOS helplines operate on "
        "device as designed.",
    )

    h2(doc, "8.2 Dataset Outcomes")
    body(
        doc,
        "Of 46,424 scored streets, most fall in the Moderate band, which is expected for a "
        "multi-factor model that rewards proximity to guardianship amenities without claiming "
        "crime prediction. The Unsafe minority highlights corridors where infrastructure "
        "proxies are weak and where future crowdsourced volume will be especially valuable.",
    )

    h2(doc, "8.3 Platform Behaviour")
    body(
        doc,
        "Anonymous reporting with optional detail fields keeps interaction cost low. Merging "
        "synthetic community pins for demonstration prevents empty-map demos while UI copy "
        "discloses that live reports join automatically. This honesty is important for viva "
        "evaluation and for any civic partner reviewing the prototype.",
    )

    h2(doc, "8.4 Discussion and Limitations")
    body(
        doc,
        "Absolute hotspot claims would be premature: Real report volume is still growing, "
        "OSM proxies are imperfect substitutes for lived experience, and unsupervised "
        "clustering has not been executed as a finished analytical product. Admin "
        "authentication via shared password suits a classroom prototype but must be replaced "
        "before any public-sector deployment. Despite these limits, Phase 1 meets its stated "
        "goal—establishing a dual data-collection architecture that later EDA and hotspot "
        "modules can consume.",
    )


def write_chapter_9(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 9: CONCLUSION")
    body(
        doc,
        f"This PBL project successfully designed and implemented {APP} as a Phase-1 system "
        "for women’s street safety data collection in Bengaluru. By pairing an auditable OSM "
        "street safety baseline with anonymous mobile and web reporting, community maps, SOS "
        "assistance, and an admin monitoring portal, the team delivered a coherent platform "
        "that is usable today and extensible for future analytics.",
    )
    body(
        doc,
        "The work demonstrates that open geographic data and privacy-conscious crowdsourcing "
        "can be combined within a student timeline without overstating analytical maturity. "
        "Subsequent phases can layer EDA, clustering-based hotspot identification, and richer "
        "moderation workflows onto the foundations documented in this report.",
    )


def write_chapter_10(doc: Document):
    page_break(doc)
    h1(doc, "CHAPTER 10: FUTURE ENHANCEMENTS")
    numbered(
        doc,
        [
            "Complete exploratory data analysis on Real reports joined with OSM street attributes.",
            "Apply unsupervised methods (for example K-Means or DBSCAN) for hotspot candidate detection with careful validation.",
            "Build moderated heatmaps and time-of-day views once Real volume is statistically meaningful.",
            "Replace shared admin password with role-based authentication and audit logs.",
            "Add optional verified volunteer roles for trusted on-ground audits.",
            "Improve offline caching of map tiles and queued report submission under poor network.",
            "Conduct structured usability studies with women students and refine SOS flows accordingly.",
            "Explore partnerships for validating proxies against anonymised official statistics where legally permitted.",
        ],
    )


def write_bibliography(doc: Document):
    page_break(doc)
    h1(doc, "BIBLIOGRAPHY / REFERENCES")
    refs = [
        "Chainey, S., & Ratcliffe, J. (2005). GIS and Crime Mapping. Wiley.",
        "OpenStreetMap Wiki — https://wiki.openstreetmap.org/",
        "Overpass API Documentation — https://dev.overpass-api.de/",
        "Expo Documentation (SDK 54) — https://docs.expo.dev/",
        "Next.js Documentation — https://nextjs.org/docs",
        "Supabase Documentation — https://supabase.com/docs",
        "Leaflet — https://leafletjs.com/",
        "React Native Documentation — https://reactnative.dev/",
        "United Nations Sustainable Development Goals — https://sdgs.un.org/goals",
        "Safetipin — https://safetipin.com/ (crowdsourced safety audit reference)",
        "BBMP / Bengaluru civic geographic references used for ward bounding-box design.",
        "Project codebase: SafeHer mobile, web, supabase migrations, and create_bengaluru_dataset.py (2026).",
    ]
    for i, r in enumerate(refs, 1):
        add_para(doc, f"{i}. {r}", size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)


def write_appendices(doc: Document):
    page_break(doc)
    h1(doc, "APPENDIX A: SUSTAINABLE DEVELOPMENT GOALS (SDG)")
    body(
        doc,
        "SafeHer aligns primarily with SDG 5 (Gender Equality) by improving access to "
        "information that supports women’s mobility and agency in public space, and with "
        "SDG 11 (Sustainable Cities and Communities) by contributing open, place-based "
        "safety intelligence for urban areas. Secondary links include SDG 16 (Peace, Justice "
        "and Strong Institutions) through better situational awareness that can inform "
        "community and civic responses, without claiming replacement of formal policing.",
    )
    bullets(
        doc,
        [
            "SDG 5: Enable anonymous reporting and SOS pathways that respect privacy.",
            "SDG 11: Publish reusable street-level datasets and maps for Bengaluru BBMP areas.",
            "SDG 9: Apply modern open-source ICT (Expo, Next.js, Supabase) to a civic problem.",
        ],
    )

    page_break(doc)
    h1(doc, "APPENDIX B: PROJECT SYNOPSIS")
    h2(doc, "B.1 Introduction")
    body(
        doc,
        "Title: Incident Analysis and Hotspot Identification for Security Provision against "
        "Women Harassment in Public Spaces. Application name: SafeHer. Students: Aman Yadav "
        "(1BY25MC012), Anusha K (1BY25MC017). Guide: Dr. M.Sridevi. Institution: BMS Institute "
        "of Technology & Management, Department of MCA. Phase focus: Data collection platform "
        "and OSM baseline (Phase 1).",
    )
    h2(doc, "B.2 Objectives")
    numbered(
        doc,
        [
            "Construct an OSM-derived street safety dataset for Bengaluru BBMP areas.",
            "Build SafeHer mobile and web clients for anonymous reporting and mapping.",
            "Implement SOS helplines and location sharing.",
            "Provide admin monitoring of OSM and community signals.",
            "Prepare foundations for later hotspot analysis without claiming it as complete.",
        ],
    )
    h2(doc, "B.3 Methodology (brief)")
    body(
        doc,
        "Overpass extraction → weighted scoring → Excel/JSON publish → Supabase schema → "
        "Expo and Next.js clients → manual and scripted testing → documentation.",
    )
    h2(doc, "B.4 Results (brief)")
    body(
        doc,
        "46,424 streets scored across 53 areas; working apps demonstrated via screenshots; "
        "anonymous reports stored with RLS; admin portal operational for demos.",
    )
    h2(doc, "B.5 Conclusion (brief)")
    body(
        doc,
        "Phase-1 goals of dual-channel data collection were achieved. Analytical hotspot "
        "products remain future work.",
    )

    page_break(doc)
    h1(doc, "APPENDIX C: PLAGIARISM REPORT")
    body(
        doc,
        "This appendix is reserved for the official plagiarism / similarity report generated "
        "by the institution’s approved tool (for example Ouriginal or Turnitin). After the "
        "final PDF export of this document, students shall upload the report file to the "
        "college portal, download the similarity certificate, and bind the certificate pages "
        "in this appendix position.",
    )
    body(
        doc,
        "Author originality note: Narrative chapters in this document were rewritten for the "
        "SafeHer Phase-1 scope. College boilerplate (Vision, Mission, PEOs, POs) is reproduced "
        "unchanged from the official PBL frontsheets template as required. Technical facts "
        "(street counts, weights, module names) are taken from the project codebase and "
        "dataset outputs, not from unrelated sample reports.",
    )
    add_para(
        doc,
        "[Paste official plagiarism certificate / similarity report pages here before final binding.]",
        size=12, italic=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=24, space_after=24,
    )


def main():
    if not FRONTSHEETS.exists():
        raise SystemExit(f"Missing frontsheets: {FRONTSHEETS}")

    print("Copying frontsheets...")
    shutil.copy2(FRONTSHEETS, OUT)
    doc = Document(str(OUT))

    print("Applying document defaults (TNR 12, 1.5)...")
    apply_document_defaults(doc)

    print("Filling title page...")
    fill_title_page(doc)

    print("Clearing placeholder Abstract/TOC...")
    clear_from_abstract(doc)

    print("Writing abstract, lists, chapters...")
    write_abstract_and_lists(doc)
    write_chapter_1(doc)
    write_chapter_2(doc)
    write_chapter_3(doc)
    write_chapter_4(doc)
    write_chapter_5(doc)
    write_chapter_6(doc)
    write_chapter_7(doc)
    write_chapter_8(doc)
    write_chapter_9(doc)
    write_chapter_10(doc)
    write_bibliography(doc)
    write_appendices(doc)

    print("Saving...", OUT)
    doc.save(str(OUT))
    print("Done.")


if __name__ == "__main__":
    main()
