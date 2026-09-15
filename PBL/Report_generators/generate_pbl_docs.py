"""
Generate SafeHer PBL Synopsis and Project Report (.docx) for BMSIT&M.
Formatting: Main 16pt TNR Bold centered; Sub 14pt TNR Bold; Body 12pt TNR 1.5 justified.
"""
from __future__ import annotations

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Inches, Pt, Cm, RGBColor
from pathlib import Path

OUT = Path(r"C:\aman\dataset for pbl")
TITLE = (
    "Incident Analysis and Hotspot Identification for "
    "Security Provision against Women Harassment in Public Spaces"
)
STUDENTS = [
    ("Aman Yadav", "1BY25MC012"),
    ("Anusha K", "1BY25MC017"),
]
GUIDE = "Dr. M.Sridevi"
SYSTEM = "SafeHer"


def set_run_font(run, size=12, bold=False, name="Times New Roman"):
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:ascii"), name)
    run._element.rPr.rFonts.set(qn("w:hAnsi"), name)
    run.font.size = Pt(size)
    run.bold = bold


def add_para(
    doc,
    text,
    *,
    size=12,
    bold=False,
    align=WD_ALIGN_PARAGRAPH.JUSTIFY,
    space_after=8,
    space_before=0,
    first_line_indent=None,
):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    if first_line_indent is not None:
        pf.first_line_indent = first_line_indent
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    return p


def add_heading_main(doc, text):
    return add_para(
        doc,
        text,
        size=16,
        bold=True,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=18,
        space_after=12,
    )


def add_heading_sub(doc, text):
    return add_para(
        doc,
        text,
        size=14,
        bold=True,
        align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=12,
        space_after=6,
    )


def add_body(doc, text):
    return add_para(doc, text, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY)


def add_caption(doc, text, *, top=False):
    return add_para(
        doc,
        text,
        size=10,
        bold=True,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=6 if top else 2,
        space_after=6,
    )


def set_page(doc, a4=True):
    section = doc.sections[0]
    if a4:
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)


def shade_cell(cell, fill_hex="D9D9D9"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill_hex)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell_text(cell, text, *, bold=False, size=11, center=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)


def add_table(doc, headers, rows, col_widths=None):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        set_cell_text(table.rows[0].cells[i], h, bold=True, size=11, center=True)
        shade_cell(table.rows[0].cells[i], "E8E0FF")
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            set_cell_text(table.rows[r_i + 1].cells[c_i], str(val), size=11)
    if col_widths:
        for row in table.rows:
            for i, w in enumerate(col_widths):
                row.cells[i].width = Inches(w)
    return table


# ---------------------------------------------------------------------------
# SYNOPSIS
# ---------------------------------------------------------------------------

def build_synopsis():
    doc = Document()
    set_page(doc, a4=True)

    add_para(doc, "PROJECT SYNOPSIS", size=20, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    add_para(doc, "on", size=14, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    for line in [
        "Incident Analysis and Hotspot Identification for",
        "Security Provision against Women Harassment",
        "in Public Spaces",
    ]:
        add_para(doc, line, size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, "", size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, "Submitted by", size=14, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    for name, usn in STUDENTS:
        add_para(doc, f"{name}        USN: {usn}", size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, "", size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, "Under the guidance of", size=14, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, GUIDE, size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    add_para(doc, "Department of Master of Computer Applications", size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=4)
    add_para(doc, "BMS Institute of Technology & Management", size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, "(Autonomous Institution under VTU), Bengaluru – 560119", size=12, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    add_para(doc, "Date of Submission: July 2026", size=14, bold=False, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)

    add_para(doc, "TABLE OF CONTENTS", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)
    toc = [
        ("1.", "INTRODUCTION"),
        ("2.", "OBJECTIVES"),
        ("3.", "LITERATURE SURVEY"),
        ("4.", "EXISTING SYSTEM"),
        ("5.", "PROPOSED SYSTEM"),
        ("6.", "MODULES IDENTIFIED"),
        ("6.1", "Data Collection and Crowdsourcing Module"),
        ("6.2", "Data Preprocessing and Area Matching Module"),
        ("6.3", "Analysis and Hotspot Module"),
        ("6.4", "Mobile Application Module (SafeHer)"),
        ("6.5", "Web User Portal Module"),
        ("6.6", "Admin Analytics Portal Module"),
        ("6.7", "Emergency SOS Module"),
        ("6.8", "Visualization and Mapping Module"),
        ("7.", "HARDWARE AND SOFTWARE REQUIREMENTS"),
        ("7.1", "Hardware Requirements"),
        ("7.2", "Software Requirements"),
        ("7.3", "Summary"),
        ("8.", "SDG ALIGNMENT"),
        ("9.", "WORK BREAKDOWN STRUCTURE"),
        ("9.1", "Phase 1: Requirements & Design (W1–W2)"),
        ("9.2", "Phase 2: Synthetic Data Generation (W3–W4)"),
        ("9.3", "Phase 3: Mobile App Development (W3–W6)"),
        ("9.4", "Phase 4: Web App & Admin Portal (W5–W8)"),
        ("9.5", "Phase 5: Analytics & OSM Integration (W7–W10)"),
        ("9.6", "Phase 6: Testing & Documentation (W11–W12)"),
        ("9.7", "Project Schedule (Gantt Chart)"),
        ("10.", "REFERENCES"),
    ]
    for num, title in toc:
        add_para(doc, f"{num}   {title}", size=12, bold=num.endswith(".") and len(num) <= 3, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)

    add_para(doc, "List of Tables and Figures", size=13, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT, space_before=10, space_after=4)
    for item in [
        "Table 7.1   Hardware Requirements",
        "Table 7.2   Software Requirements and Tools Used",
        "Table 9.1   Work Breakdown – Phase Timeline",
        "Fig. 9.1    Project Schedule – Gantt Chart",
    ]:
        add_para(doc, item, size=12, align=WD_ALIGN_PARAGRAPH.LEFT, space_after=2)

    # 1. INTRODUCTION
    add_heading_main(doc, "1. INTRODUCTION")
    add_body(
        doc,
        "Women’s safety in public spaces is a critical concern in dense urban environments such as Bengaluru. "
        "Harassment and related incidents on streets, near transit hubs, and in poorly lit localities threaten "
        "personal security and restrict mobility. Research in crime analysis shows that such events are not "
        "randomly distributed; they concentrate in particular places and times—commonly called hotspots "
        "(Sherman, 1989; Chainey & Ratcliffe, 2005).",
    )
    add_body(
        doc,
        "Existing mobile applications (for example bSafe and Safetipin) mainly offer reactive help—SOS alerts, "
        "live location sharing, or subjective safety scores. They rarely combine historical/community incident "
        "patterns with city-scale infrastructure data to support preventive planning. OpenStreetMap (OSM) "
        "provides rich geospatial features (lighting proxies, amenities, road networks) that can complement "
        "crowdsourced safety feedback.",
    )
    add_body(
        doc,
        f"This project presents {SYSTEM}, a Bengaluru-focused women’s street-safety platform that unifies three "
        "layers: (i) a mobile application for GPS-based safe/unsafe and incident reporting, community map viewing, "
        "and SOS helplines; (ii) a public web user site with the same citizen features; and (iii) a password-protected "
        "admin portal for OSM street analytics, BBMP area comparison, and Generated versus Real report dashboards. "
        "Reports are stored in Supabase; maps use OSM tiles. Synthetic community reports support testing and "
        "demonstration alongside live submissions. Clustering and spatial scoring help identify relative risk "
        "across BBMP areas, aligning with SDG 5 (Gender Equality).",
    )

    # 2. OBJECTIVES
    add_heading_main(doc, "2. OBJECTIVES")
    add_body(
        doc,
        f"The primary objective is to design and implement {SYSTEM}, a data-driven system that collects "
        "women’s safety reports, analyses spatial patterns, and surfaces hotspots to support preventive security "
        "provision in public spaces.",
    )
    add_body(doc, "The specific objectives are as follows:")
    objectives = [
        "To collect and analyse incident and perception data (location, time, incident type, environmental factors) related to women’s safety in Bengaluru.",
        "To identify high-risk / hotspot areas using spatial aggregation over BBMP zones and clustering techniques such as K-Means on geospatial features.",
        "To build a mobile application (Expo/React Native) for anonymous GPS reporting, community map visualisation, and emergency SOS actions.",
        "To develop a public web portal for reporting, mapping, and emergency assistance without login barriers.",
        "To develop an admin analytics portal with OSM infrastructure KPIs, Generated vs Real report comparison, street search, and area ranking.",
        "To integrate OpenStreetMap data and Folium/Leaflet maps for transparent, open geospatial visualisation.",
        "To generate synthetic demo reports for pipeline validation while keeping live crowdsourced data separately identifiable.",
        "To align deliverables with SDG 5 (Target 5.2) by enabling preventive insight rather than only reactive SOS response.",
    ]
    for o in objectives:
        add_para(doc, o, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)

    # 3. LITERATURE SURVEY
    add_heading_main(doc, "3. LITERATURE SURVEY")
    add_body(
        doc,
        "Chainey and Ratcliffe (2005) describe GIS-based crime mapping and hotspot detection as essential for "
        "allocating police and civic resources. Sherman (1989) established that crime concentrates at places, "
        "motivating hotspot policing. Urban safety studies (e.g., Nehme et al., 2017) emphasise environmental "
        "factors—lighting, visibility, crowd presence—that shape women’s perceived and actual safety.",
    )
    add_body(
        doc,
        "Commercial and civic apps such as Safetipin crowd-source safety audits, while SOS apps emphasise "
        "emergency response. Academic work on OpenStreetMap shows that volunteered geographic information can "
        "approximate infrastructure quality when official datasets are incomplete. Machine learning methods "
        "including K-Means are widely used to cluster spatial points for hotspot discovery.",
    )
    add_body(
        doc,
        f"{SYSTEM} builds on these strands by combining OSM street-level scoring, crowdsourced reports "
        "(mobile/web), synthetic data for controlled evaluation, and an admin dashboard that separates demo "
        "data from real user submissions—addressing the gap between reactive SOS tools and preventive analytics.",
    )

    # 4. EXISTING SYSTEM
    add_heading_main(doc, "4. EXISTING SYSTEM")
    add_body(
        doc,
        "Current women’s safety support is dominated by emergency-centric mobile apps and general mapping "
        "platforms. Typical features include SOS buttons, trusted-contact SMS, and occasional crowd safety scores. "
        "Authorities may also use closed police crime databases that are not citizen-facing.",
    )
    add_body(doc, "Limitations of the existing landscape include:")
    for lim in [
        "Reactive focus: assistance usually starts after an emergency is triggered.",
        "Weak preventive analytics: limited hotspot identification from longitudinal community reports.",
        "Fragmentation: citizen apps, OSM data science notebooks, and civic dashboards rarely form one system.",
        "Opaque data mixing: demo/synthetic and live data are seldom separated in analytics views.",
        "Limited admin tooling for BBMP-scale comparison of infrastructure versus community perception.",
    ]:
        add_para(doc, lim, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    # 5. PROPOSED SYSTEM
    add_heading_main(doc, "5. PROPOSED SYSTEM")
    add_body(
        doc,
        f"The proposed system, {SYSTEM}, is an end-to-end platform for incident capture, hotspot awareness, "
        "and security-oriented analytics in Bengaluru public spaces.",
    )
    add_body(
        doc,
        "Citizens use the mobile app or public website to report ‘I feel safe’, ‘I feel unsafe’, or ‘Something "
        "happened’ (incident types such as harassment, stalking, theft, assault, suspicious activity). GPS "
        "coordinates are matched to BBMP areas and stored in Supabase with rate limiting. Maps display approved "
        "community points. SOS screens expose helplines and live-location sharing.",
    )
    add_body(
        doc,
        "Administrators authenticate to a dedicated portal to inspect OSM street safety KPIs (~46k streets across "
        "53 BBMP areas), search streets, compare areas, and analyse Generated (synthetic) versus Real (live) "
        "reports. Python pipelines with Pandas and K-Means support dataset construction and clustering; Folium/"
        "Leaflet provide map visualisation. This preventive, multi-channel design extends beyond SOS-only apps.",
    )

    # 6. MODULES
    add_heading_main(doc, "6. MODULES IDENTIFIED")
    add_body(
        doc,
        f"{SYSTEM} is organised into modular components spanning data science, mobile, web, backend, and emergency response.",
    )

    modules = [
        (
            "6.1 Data Collection and Crowdsourcing Module",
            "Collects GPS-tagged safety and incident reports from mobile and web clients into Supabase "
            "(anonymous device identifiers, optional anonymous auth). Also ingests OSM extracts for Bengaluru streets.",
        ),
        (
            "6.2 Data Preprocessing and Area Matching Module",
            "Cleans coordinates, assigns BBMP area labels via bounding-box matching with reverse-geocode fallback, "
            "normalises factors (lighting, crowd, CCTV, police proximity), and separates synthetic from live records.",
        ),
        (
            "6.3 Analysis and Hotspot Module",
            "Aggregates area-level safety percentages and ratings; applies K-Means / spatial scoring on OSM and "
            "community features to highlight relatively unsafe zones for admin dashboards.",
        ),
        (
            "6.4 Mobile Application Module (SafeHer)",
            "Expo/React Native app with Home, Report wizard, Map (filters for safe/unsafe/incidents), and SOS tabs; "
            "packages as a shareable Android debug APK.",
        ),
        (
            "6.5 Web User Portal Module",
            "Public Next.js site (no login) for landing, report, map, emergency, and a simplified safety overview.",
        ),
        (
            "6.6 Admin Analytics Portal Module",
            "Password-protected Next.js admin area: OSM dashboard, full analytics (Generated/Real/Compare), map, "
            "street search, BBMP areas, and methodology pages.",
        ),
        (
            "6.7 Emergency SOS Module",
            "Helpline directory, click-to-call/SMS with live coordinates, and trusted-contact sharing on mobile and web.",
        ),
        (
            "6.8 Visualization and Mapping Module",
            "Leaflet/OSM maps on web and react-native-maps on mobile; Folium-based exploratory maps in the Python "
            "analysis workflow; colour-coded pins and area overlays.",
        ),
    ]
    for title, body in modules:
        add_heading_sub(doc, title)
        add_body(doc, body)

    # 7. H/W S/W
    add_heading_main(doc, "7. HARDWARE AND SOFTWARE REQUIREMENTS")
    add_body(
        doc,
        "The platform is designed to run on standard student/developer hardware and commodity cloud services.",
    )
    add_heading_sub(doc, "7.1 Hardware Requirements")
    add_caption(doc, "Table 7.1: Hardware Requirements", top=True)
    add_table(
        doc,
        ["Component", "Minimum Specification"],
        [
            ["Development PC", "Intel/AMD 64-bit CPU, 8 GB RAM (16 GB preferred), 20 GB free disk"],
            ["Display", "1366×768 or higher"],
            ["Android device (testing)", "Android 8+, GPS, internet (Wi-Fi/mobile data)"],
            ["Network", "Broadband for Supabase, OSM tiles, and Expo/Metro tooling"],
        ],
    )

    add_heading_sub(doc, "7.2 Software Requirements")
    add_caption(doc, "Table 7.2: Software Requirements and Tools Used", top=True)
    add_table(
        doc,
        ["Layer", "Tools / Technologies"],
        [
            ["Data science", "Python 3, Pandas, scikit-learn (K-Means), Folium, Excel/CSV/JSON exports"],
            ["Mobile", "Expo SDK 54, React Native, TypeScript, Expo Location, AsyncStorage"],
            ["Web (user & admin)", "Next.js, React, TypeScript, Leaflet, Recharts, Tailwind CSS"],
            ["Backend / DB", "Supabase (PostgreSQL, Auth anon, RLS policies)"],
            ["Maps", "OpenStreetMap tiles; react-native-maps (mobile)"],
            ["Build / IDE", "Node.js, Android Studio JDK, Gradle (debug APK), VS Code / Cursor"],
        ],
    )

    add_heading_sub(doc, "7.3 Summary")
    add_body(
        doc,
        "Python analytics, Expo mobile, Next.js web, and Supabase together enable collection, hotspot-oriented "
        "analysis, and dual citizen/admin experiences without specialised enterprise hardware.",
    )

    # 8. SDG
    add_heading_main(doc, "8. SDG ALIGNMENT")
    add_body(
        doc,
        "This project aligns with United Nations Sustainable Development Goal 5 – Gender Equality, particularly "
        "Target 5.2 (eliminate violence against women and girls in public and private spheres) and Indicator 5.2.2 "
        "(sexual violence by non-intimate partners, by place of occurrence).",
    )
    add_body(
        doc,
        f"{SYSTEM} contributes by enabling anonymous reporting of harassment-related incidents and unsafe "
        "perceptions, visualising geographic concentration for awareness, and giving administrators OSM-backed "
        "insights to prioritise lighting, policing, and infrastructure. The emphasis on prevention and open data "
        "supports safer, more inclusive public spaces for women in Bengaluru.",
    )

    # 9. WBS
    add_heading_main(doc, "9. WORK BREAKDOWN STRUCTURE")
    add_body(
        doc,
        "Work is organised into six phases across a twelve-week PBL calendar, covering design, data, mobile, "
        "web/admin, analytics, and documentation.",
    )

    phases = [
        (
            "9.1 Phase 1: Requirements & Design (W1–W2)",
            "Problem framing, stakeholder needs (citizen vs admin), literature review, and architecture of "
            f"{SYSTEM} (mobile, web user, admin, Supabase, OSM).",
        ),
        (
            "9.2 Phase 2: Synthetic Data Generation (W3–W4)",
            "Python/Pandas pipelines to build Bengaluru street safety datasets and ~640 synthetic community "
            "reports aligned to BBMP areas for demo analytics.",
        ),
        (
            "9.3 Phase 3: Mobile App Development (W3–W6)",
            "Expo app tabs: Home, Report (including incidents), Map, SOS; GPS area matching; Supabase submit/"
            "load; Android debug APK packaging.",
        ),
        (
            "9.4 Phase 4: Web App & Admin Portal (W5–W8)",
            "Next.js public user site and password-gated admin portal with separated navigation and auth cookie.",
        ),
        (
            "9.5 Phase 5: Analytics & OSM Integration (W7–W10)",
            "OSM KPIs, Generated vs Real dashboards, BBMP area comparison, Leaflet maps, clustering/hotspot views.",
        ),
        (
            "9.6 Phase 6: Testing & Documentation (W11–W12)",
            "Functional testing of report/SOS/admin login, APK install checks, synopsis and project report preparation.",
        ),
    ]
    for title, body in phases:
        add_heading_sub(doc, title)
        add_body(doc, body)

    add_heading_sub(doc, "9.7 Project Schedule (Gantt Chart)")
    add_body(
        doc,
        "Table 9.1 and Fig. 9.1 summarise the twelve-week schedule. Shaded cells (●) mark active weeks.",
    )
    add_caption(doc, "Table 9.1: Work Breakdown – Phase Timeline", top=True)

    weeks = [f"W{i}" for i in range(1, 13)]
    gantt_rows = [
        ("Phase 1: Requirements & Design", [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        ("Phase 2: Synthetic Data Generation", [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0]),
        ("Phase 3: Mobile App Development", [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0]),
        ("Phase 4: Web App & Admin Portal", [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0]),
        ("Phase 5: Analytics & OSM Integration", [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0]),
        ("Phase 6: Testing & Documentation", [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]),
    ]
    headers = ["Phase"] + weeks
    rows = []
    for name, flags in gantt_rows:
        rows.append([name] + [("●" if f else "") for f in flags])
    add_table(doc, headers, rows)
    add_caption(doc, "Fig. 9.1: Project Schedule – Gantt Chart (● = Active)")

    # 10. REFERENCES
    add_heading_main(doc, "10. REFERENCES")
    refs = [
        "Spencer Chainey & Jerry Ratcliffe (2005). GIS and Crime Mapping. Wiley.",
        "Lawrence Sherman (1989). Hot Spots of Crime and Criminal Careers of Places. Criminology, 27(1), 27–56.",
        "United Nations (2020). Sustainable Development Goal 5. https://sdgs.un.org/goals/goal5",
        "My Safetipin. https://safetipin.com",
        "bSafe. https://www.getbsafe.com",
        "OpenStreetMap contributors. https://www.openstreetmap.org",
        "Expo Documentation. https://docs.expo.dev",
        "Next.js Documentation. https://nextjs.org/docs",
        "Supabase Documentation. https://supabase.com/docs",
    ]
    for r in refs:
        add_para(doc, r, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    path = OUT / "SafeHer_PBL_Synopsis.docx"
    doc.save(str(path))
    return path


# ---------------------------------------------------------------------------
# PROJECT REPORT
# ---------------------------------------------------------------------------

def build_report():
    doc = Document()
    set_page(doc, a4=True)

    # Title-like front matter (content pages; college frontsheets exist separately)
    add_para(doc, "PROJECT BASED LEARNING REPORT", size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    add_para(doc, "on", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    add_para(doc, TITLE, size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    add_para(doc, f"System Name: {SYSTEM}", size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    add_para(doc, "Submitted by", size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    for name, usn in STUDENTS:
        add_para(doc, f"{name} (USN: {usn})", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, f"Under the Guidance of {GUIDE}", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_before=8)
    add_para(
        doc,
        "Department of Master of Computer Applications\nBMS Institute of Technology & Management\nBengaluru – 560119\nJuly 2026",
        size=12,
        bold=False,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=12,
        space_after=18,
    )

    add_heading_main(doc, "ABSTRACT")
    add_body(
        doc,
        f"{SYSTEM} is a Bengaluru women’s street-safety platform that combines crowdsourced incident and "
        "perception reports with OpenStreetMap-based infrastructure analytics. Citizens use an Android/Expo "
        "mobile app and a public web site to submit GPS-tagged safe/unsafe/incident reports, view community maps, "
        "and access SOS helplines. Administrators use a password-protected portal to explore OSM street scores, "
        "BBMP area comparisons, and Generated versus Real analytics dashboards. Data is stored in Supabase; "
        "Python/Pandas/K-Means pipelines generate street datasets and synthetic reports for testing. The work "
        "supports preventive hotspot awareness aligned with SDG 5.",
    )

    # 1
    add_heading_main(doc, "1. INTRODUCTION")
    add_heading_sub(doc, "1.1 Project Description")
    add_body(
        doc,
        f"{SYSTEM} addresses women’s harassment and unsafe conditions in Bengaluru public spaces through a "
        "three-tier software system: mobile client, public web client, and admin analytics portal. Users report "
        "how a place feels or whether an incident occurred; GPS is mapped to BBMP areas; approved reports appear "
        "on community maps. Admins analyse OSM-derived street safety scores (~46,000 streets, 53 BBMP areas) and "
        "compare synthetic demonstration data with live Supabase submissions.",
    )
    add_body(
        doc,
        "The system is intentionally dual-purpose: it provides immediate citizen tools (report, map, SOS) and "
        "longer-horizon analytical tools (hotspot-oriented dashboards, infrastructure KPIs) for PBL evaluation "
        "and potential civic insight.",
    )
    add_heading_sub(doc, "1.2 Project Profile")
    for item in [
        "Project type: Academic PBL – full-stack safety analytics and crowdsourcing system.",
        "Domain: Women’s public-space safety, geospatial analytics, civic tech.",
        "Primary users: Women citizens (mobile/web); project team/admin analysts (admin portal).",
        "Data stores: Supabase PostgreSQL (live reports); local JSON synthetic reports; OSM-derived Excel/JSON street dataset.",
        "Deployment model: Local/dev web (Next.js), Expo/Android debug APK, cloud Supabase backend.",
    ]:
        add_para(doc, item, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    # 2
    add_heading_main(doc, "2. LITERATURE SURVEY")
    add_heading_sub(doc, "2.1 Existing and Proposed System")
    add_heading_sub(doc, "Existing System")
    add_body(
        doc,
        "Existing solutions emphasise SOS response and occasional crowd safety scores. They seldom integrate "
        "open street infrastructure data with live crowdsourcing and an explicit admin analytics layer that "
        "separates demo from real data.",
    )
    add_heading_sub(doc, "Proposed System")
    add_body(
        doc,
        f"{SYSTEM} proposes a preventive stack: crowdsourcing + OSM scoring + hotspot-oriented visualisation + "
        "role-separated user/admin web experiences, with mobile parity for citizens.",
    )
    add_heading_sub(doc, "2.2 Feasibility Study")
    add_heading_sub(doc, "2.2.1 Technical Feasibility")
    add_body(
        doc,
        "All major components use mature open-source stacks (Python, Expo, Next.js, Supabase, OSM). GPS APIs "
        "and map SDKs are widely supported on Android and browsers, confirming technical feasibility for a student PBL.",
    )
    add_heading_sub(doc, "2.2.2 Operational Feasibility")
    add_body(
        doc,
        "Citizen flows are short wizards; admin uses a password gate suitable for demo environments. Synthetic "
        "data allows demos even when live report volume is low.",
    )
    add_heading_sub(doc, "2.2.3 Economic Feasibility")
    add_body(
        doc,
        "Tooling is free/open source; Supabase free-tier usage and OSM tiles keep pilot cost near zero for academic demonstration.",
    )
    add_heading_sub(doc, "2.3 Tools and Technologies Used")
    add_caption(doc, "Table 2.1: Technology Stack", top=True)
    add_table(
        doc,
        ["Category", "Technology"],
        [
            ["Languages", "Python, TypeScript, SQL"],
            ["Mobile", "Expo 54, React Native, Expo Router, Expo Location"],
            ["Web", "Next.js, React, Leaflet, Recharts, Tailwind"],
            ["Backend", "Supabase (Postgres, RLS, anonymous auth helpers)"],
            ["Analytics", "Pandas, K-Means (scikit-learn), Folium"],
            ["Maps / Geo", "OpenStreetMap, BBMP area bounding boxes"],
        ],
    )
    add_heading_sub(doc, "2.4 Hardware and Software Requirements")
    add_body(
        doc,
        "Refer to Synopsis Tables 7.1 and 7.2. Development used a Windows PC with Android SDK/JDK for debug APK "
        "builds and Node.js for web/mobile tooling.",
    )

    # 3 SRS
    add_heading_main(doc, "3. SOFTWARE REQUIREMENTS SPECIFICATION")
    add_heading_sub(doc, "3.1 Users")
    add_heading_sub(doc, "3.1.1 Scope and Objective")
    add_body(
        doc,
        "Scope covers Bengaluru BBMP areas: citizen reporting, mapping, SOS, OSM analytics, and Generated/Real "
        "community dashboards. Objective is safer route awareness and hotspot identification support.",
    )
    add_heading_sub(doc, "3.1.2 Assumptions and Dependencies")
    for a in [
        "Users grant location permission for accurate area matching.",
        "Internet connectivity is available for Supabase and map tiles.",
        "Admin password is configured via environment variable for portal access.",
        "Synthetic JSON remains available for Generated analytics when live data is sparse.",
    ]:
        add_para(doc, a, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    add_heading_sub(doc, "3.2 Functional Requirements")
    for fr in [
        "FR1: Mobile/web shall capture GPS and submit safe/unsafe/incident reports to Supabase.",
        "FR2: System shall map coordinates to BBMP area names.",
        "FR3: Map views shall display community report points with filters.",
        "FR4: SOS module shall list helplines and support location sharing.",
        "FR5: Admin shall authenticate and access OSM and community analytics.",
        "FR6: Analytics shall separate Generated and Real report sources.",
        "FR7: Rate limiting shall reduce spam from a single device.",
    ]:
        add_para(doc, fr, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)

    add_heading_sub(doc, "3.3 Non-Functional Requirements")
    for nfr in [
        "NFR1: Usability – stepped report wizard; clear SOS entry points.",
        "NFR2: Privacy – anonymous-by-default reporting; no public PII in comments guidance.",
        "NFR3: Performance – map loads batched report subsets; OSM tiles via CDN.",
        "NFR4: Security – admin cookie session; Supabase RLS for approved reads.",
        "NFR5: Maintainability – shared area logic; modular Next.js/Expo codebases.",
    ]:
        add_para(doc, nfr, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)

    # 4 System design
    add_heading_main(doc, "4. SYSTEM DESIGN")
    add_heading_sub(doc, "4.1 System Architecture")
    add_body(
        doc,
        f"{SYSTEM} follows a client–server architecture. Mobile and web user clients talk to Supabase for "
        "inserts/selects on the reports table. The admin web app reads the same community data plus static OSM "
        "summary JSON hosted with the Next.js public assets. Python offline jobs produce street datasets and "
        "synthetic community JSON consumed by both clients.",
    )
    add_caption(doc, "Fig. 4.1: High-level SafeHer Architecture (conceptual)")
    add_para(
        doc,
        "[Mobile App] + [Web User] --> [Supabase Reports] ; [Admin Portal] --> [Supabase + OSM JSON] ; "
        "[Python Pipeline] --> [Street Dataset / Synthetic JSON]",
        size=11,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=10,
    )

    add_heading_sub(doc, "4.2 System Perspective")
    add_body(
        doc,
        "From a product perspective, citizens never see OSM research dashboards; admins do not use SOS as a "
        "primary workflow. This separation reduces cognitive load and matches PBL evaluation of both citizen UX "
        "and analytical depth.",
    )
    add_heading_sub(doc, "4.3 Context Diagram")
    add_body(
        doc,
        "External entities: Citizen, Admin Analyst, Supabase Cloud, OSM Tile Servers, Telecom (calls/SMS). "
        "Central process: SafeHer Platform (report ingest, area match, map serve, analytics).",
    )

    # 5 Detailed design
    add_heading_main(doc, "5. DETAILED DESIGN")
    add_heading_sub(doc, "5.1 Dataflow Diagram")
    add_body(
        doc,
        "Level-0: Citizen provides GPS + report fields → SafeHer → stores in Supabase; Map queries approved "
        "reports; Admin queries aggregates. Python pipeline writes synthetic JSON offline.",
    )
    add_heading_sub(doc, "5.2 Activity Diagram")
    add_body(
        doc,
        "Report activity: Open Report → Request location permission → Resolve BBMP area → Choose feeling/incident "
        "→ Optional details → Submit → Success / rate-limit error. SOS activity: Open SOS → Select helpline → "
        "Call or share live location.",
    )
    add_heading_sub(doc, "5.3 Use Case Diagram")
    add_body(
        doc,
        "Citizen use cases: Submit Report, View Map, Use SOS, View Safety Overview. Admin use cases: Login, "
        "View OSM Dashboard, View Community Analytics, Search Streets, Compare Areas, Logout.",
    )
    add_heading_sub(doc, "5.4 Sequence Diagram")
    add_body(
        doc,
        "Submit Report sequence: Client → Geolocation API → Area Matcher → Supabase.insert(reports) → "
        "Client success UI. Admin Analytics sequence: Browser → Admin Auth Cookie → loadSynthetic JSON + "
        "loadLive Supabase → aggregate → charts.",
    )

    # 6 Implementation
    add_heading_main(doc, "6. IMPLEMENTATION")
    add_heading_sub(doc, "6.1 Data Collection Methodology")
    add_body(
        doc,
        "Live data: users voluntarily submit reports with lat/lon, area, is_safe / incident_type, optional "
        "factors and comments. Device IDs enable hourly rate limits. Synthetic data: generated to resemble "
        "area-wise distributions for demos without exposing personal data.",
    )
    add_heading_sub(doc, "6.2 Synthetic Data Generation")
    add_body(
        doc,
        "A Python pipeline constructs Bengaluru street safety features from OSM-oriented processing and exports "
        "summary/area JSON for the admin dashboard. Approximately 640 synthetic community reports are bundled as "
        "JSON for mobile and web, flagged is_synthetic so analytics can isolate them from Real submissions.",
    )
    add_heading_sub(doc, "6.3 OSM Integration")
    add_body(
        doc,
        "OSM contributes (a) basemap tiles for Leaflet/mobile maps and (b) street-level safety scoring inputs "
        "aggregated into public/data summary artefacts. Admin dashboard KPIs (total streets, average score, "
        "safe/moderate/unsafe counts, CCTV coverage proxies, distances) are derived from this dataset.",
    )
    add_heading_sub(doc, "6.4 Mobile Implementation")
    add_body(
        doc,
        "Expo Router tabs implement Home, Report, Map, and SOS. Report supports safe, unsafe, and incident "
        "branches with incident-type selection. Map filters include Incidents. A local Gradle assembleDebug "
        "build produces SafeHer-debug.apk for sharing.",
    )
    add_heading_sub(doc, "6.5 Web User and Admin Implementation")
    add_body(
        doc,
        "Next.js App Router uses a (user) route group with UserNav and an /admin tree with AdminNav plus "
        "middleware cookie checks. Public routes: /, /report, /map, /emergency, /community. Admin routes: "
        "/admin/dashboard, /analytics, /map, /search, /areas, /methodology.",
    )
    add_heading_sub(doc, "6.6 Snippet Code (Illustrative)")
    add_body(
        doc,
        "Report submission conceptually inserts { lat, lon, area, is_safe, report_kind, incident_type, ... } "
        "into Supabase reports. Area matching tests point-in-bbox against BBMP dictionaries shared across "
        "web and mobile TypeScript modules.",
    )
    add_heading_sub(doc, "6.7 Screenshots (Description)")
    for shot in [
        "Mobile Home – entry to report/map/SOS.",
        "Mobile Report – location card, feeling/incident choices, submit confirmation.",
        "Mobile Map – coloured pins and incident filter.",
        "Mobile SOS – helpline list and share-location actions.",
        "Web User Home – SafeHer landing CTAs.",
        "Web Report / Map / Emergency – browser equivalents.",
        "Admin Login – password gate.",
        "Admin Dashboard – OSM KPIs and charts.",
        "Admin Analytics – Generated / Real / Compare tabs.",
    ]:
        add_para(doc, shot, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=3)
    add_body(
        doc,
        "Note: Actual screenshot images can be pasted into Appendix slots during final binding; captions should "
        "follow Fig. X.Y format (10 pt Times New Roman, bold, centred).",
    )

    # 7 Testing
    add_heading_main(doc, "7. SOFTWARE TESTING")
    add_heading_sub(doc, "7.1 Unit Testing")
    add_body(
        doc,
        "Area-matching helpers and analytics aggregations were validated with known coordinates and sample "
        "report sets. Admin password mismatch and missing ADMIN_PASSWORD cases return explicit errors.",
    )
    add_heading_sub(doc, "7.2 Integration / System Testing")
    add_body(
        doc,
        "End-to-end checks: submit report from web/mobile → appears in Real analytics; synthetic-only mode still "
        "renders Generated charts; unauthenticated /admin/dashboard redirects to login; authenticated session "
        "reaches dashboard.",
    )
    add_heading_sub(doc, "7.3 Test Cases")
    add_caption(doc, "Table 7.1: Sample Test Cases", top=True)
    add_table(
        doc,
        ["ID", "Scenario", "Expected Result"],
        [
            ["TC01", "Report without location permission", "Clear error; retry afforded"],
            ["TC02", "Submit incident with type", "Stored as report_kind=incident; map filterable"],
            ["TC03", "Exceed rate limit", "Friendly rate-limit message"],
            ["TC04", "Admin wrong password", "401 Incorrect password"],
            ["TC05", "Admin correct password", "Cookie set; dashboard loads"],
            ["TC06", "Install debug APK", "App installs on arm64 Android device"],
        ],
    )

    # 8 Conclusion
    add_heading_main(doc, "8. CONCLUSION")
    add_body(
        doc,
        f"The PBL deliverable {SYSTEM} demonstrates a practical path from women’s safety problem statements to "
        "a working multi-client system with crowdsourcing, OSM analytics, and hotspot-oriented visualisation. "
        "Citizen and admin experiences are deliberately separated. Future work may include stronger moderation "
        "workflows, richer clustering on live incidents, push notifications, and production signing of Android builds.",
    )

    # 9 Bibliography
    add_heading_main(doc, "9. BIBLIOGRAPHY")
    for r in [
        "Chainey, S., & Ratcliffe, J. (2005). GIS and Crime Mapping. Wiley.",
        "Sherman, L. W. (1989). Hot Spots of Crime and Criminal Careers of Places. Criminology, 27(1).",
        "United Nations. Sustainable Development Goal 5. https://sdgs.un.org/goals/goal5",
        "OpenStreetMap Wiki & Contributors. https://wiki.openstreetmap.org",
        "Expo Docs. https://docs.expo.dev",
        "Next.js Docs. https://nextjs.org/docs",
        "Supabase Docs. https://supabase.com/docs",
        "Safetipin. https://safetipin.com",
        "bSafe. https://www.getbsafe.com",
    ]:
        add_para(doc, r, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    add_heading_main(doc, "APPENDIX A: SUSTAINABLE DEVELOPMENT GOALS (SDG)")
    add_body(
        doc,
        "Identified SDG: Goal 5 – Gender Equality. Target 5.2; Indicator 5.2.2. Contribution: anonymous "
        "reporting, hotspot visibility, and OSM-informed admin insights for safer public spaces.",
    )
    add_heading_main(doc, "APPENDIX B: SYNOPSIS")
    add_body(
        doc,
        "The updated Project Synopsis document (SafeHer_PBL_Synopsis.docx) is enclosed separately as per "
        "department PBL submission practice.",
    )
    add_heading_main(doc, "APPENDIX C: PLAGIARISM REPORT")
    add_body(
        doc,
        "Plagiarism / similarity report to be attached after institutional scanning of the final bound report.",
    )

    path = OUT / "SafeHer_PBL_Project_Report.docx"
    doc.save(str(path))
    return path


if __name__ == "__main__":
    s = build_synopsis()
    r = build_report()
    print("Wrote:", s)
    print("Wrote:", r)
