"""
Phase-1-only PBL Project Report for SafeHer / Women's Street Safety.
BMSIT&M formatting: TNR; H1 16pt Bold Center; H2 14pt Bold; Body 12pt 1.5 Justified.
"""
from __future__ import annotations

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt
from pathlib import Path

OUT = Path(r"C:\aman\dataset for pbl\SafeHer_Phase1_Project_Report.docx")
TITLE = (
    "Incident Analysis and Hotspot Identification for "
    "Security Provision against Women Harassment in Public Spaces"
)
STUDENTS = [("Aman Yadav", "1BY25MC012"), ("Anusha K", "1BY25MC017")]
GUIDE = "Dr. M.Sridevi"
DATE = "30th April, 2026"


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
):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)
    return p


def h1(doc, text):
    return add_para(
        doc, text, size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=18, space_after=12,
    )


def h2(doc, text):
    return add_para(
        doc, text, size=14, bold=True, align=WD_ALIGN_PARAGRAPH.LEFT,
        space_before=12, space_after=6,
    )


def body(doc, text):
    return add_para(doc, text, size=12, bold=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY)


def caption_table(doc, text):
    return add_para(
        doc, text, size=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=8, space_after=4,
    )


def caption_fig(doc, text):
    return add_para(
        doc, text, size=10, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER,
        space_before=4, space_after=10,
    )


def shade_cell(cell, fill="E8E0FF"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    shd.set(qn("w:val"), "clear")
    tcPr.append(shd)


def set_cell(cell, text, *, bold=False, size=11, center=False):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    run = p.add_run(text)
    set_run_font(run, size=size, bold=bold)


def add_table(doc, headers, rows):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        set_cell(table.rows[0].cells[i], h, bold=True, size=11, center=True)
        shade_cell(table.rows[0].cells[i])
    for r_i, row in enumerate(rows):
        for c_i, val in enumerate(row):
            set_cell(table.rows[r_i + 1].cells[c_i], str(val), size=11)
    return table


def build():
    doc = Document()
    sec = doc.sections[0]
    sec.page_width = Cm(21.0)
    sec.page_height = Cm(29.7)
    sec.left_margin = Inches(1)
    sec.right_margin = Inches(1)
    sec.top_margin = Inches(1)
    sec.bottom_margin = Inches(1)

    # ----- Title page content -----
    add_para(doc, "PROJECT BASED LEARNING REPORT", size=18, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    add_para(doc, "on", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    add_para(doc, TITLE, size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)
    add_para(doc, "Phase 1: Data Collection", size=14, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    add_para(doc, "(OSM-based Street Safety Dataset & SafeHer Crowdsourcing Platform)",
             size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    add_para(doc, "Submitted by", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    for name, usn in STUDENTS:
        add_para(doc, f"{name}        USN: {usn}", size=12, bold=True,
                 align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, "", size=12, align=WD_ALIGN_PARAGRAPH.CENTER)
    add_para(doc, "Under the guidance of", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, GUIDE, size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    add_para(doc, "Department of Master of Computer Applications", size=12, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, "BMS Institute of Technology & Management", size=12, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    add_para(doc, "(Autonomous Institution under VTU), Bengaluru – 560119", size=12,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    add_para(doc, f"Date of Submission: {DATE}", size=12, bold=True,
             align=WD_ALIGN_PARAGRAPH.CENTER, space_after=18)

    # ABSTRACT
    h1(doc, "ABSTRACT")
    body(
        doc,
        "This Project Based Learning (PBL) report documents Phase 1 — Data Collection for the project "
        "“Incident Analysis and Hotspot Identification for Security Provision against Women Harassment "
        "in Public Spaces.” Phase 1 has two complementary deliverables. Part A produces a synthetic "
        "street-safety scored dataset for Bengaluru by extracting OpenStreetMap (OSM) infrastructure "
        "features (lighting proxies, footpaths/road class, traffic-related tags, proximity to police, "
        "hospitals, bus stops, CCTV-related signals, and related attributes) and computing a weighted "
        "safety score that classifies each street segment as safe, moderate, or unsafe. The resulting "
        "dataset covers approximately 46,000 streets across 53 BBMP zones and forms the primary "
        "infrastructure baseline for later hotspot analysis. Part B delivers SafeHer, a crowdsourcing "
        "platform through which women can anonymously report whether a street or area feels safe or "
        "unsafe (and optionally report incidents). SafeHer comprises an Android/Expo mobile app, a "
        "public web user site, and a password-protected admin portal. Live reports are stored in "
        "Supabase; maps use OpenStreetMap tiles. Subsequent phases (exploratory data analysis, "
        "K-Means clustering, hotspot identification, and heatmap dashboards) are planned as future "
        "work and are not claimed as completed in this report.",
    )

    # 1 INTRODUCTION
    h1(doc, "1. INTRODUCTION")
    h2(doc, "1.1 Problem Statement")
    body(
        doc,
        "Women’s safety in public spaces remains a serious urban challenge. Harassment and related "
        "incidents on streets, near transit hubs, and in poorly lit localities restrict mobility and "
        "create fear. In Bengaluru, civic agencies and citizens need reliable, place-based information "
        "about which streets and BBMP zones may be comparatively safer or riskier. Official crime "
        "records are often delayed, incomplete for perception-based risk, or not available as open "
        "street-level datasets. Purely reactive SOS applications help after an emergency begins, but "
        "they do not by themselves build a structured city-scale dataset that combines infrastructure "
        "context with lived experience.",
    )
    body(
        doc,
        "Therefore, this project begins with a foundational data-collection phase: (i) construct an "
        "OSM-derived street safety scored dataset for Bengaluru, and (ii) deploy SafeHer so that real "
        "crowdsourced safety reports can be collected continuously and stored for later analysis.",
    )

    h2(doc, "1.2 Motivation")
    body(
        doc,
        "Research on crime concentration shows that risk is spatially uneven. OpenStreetMap provides "
        "open infrastructure signals that can approximate environmental safety factors when official "
        "GIS layers are scarce. Crowdsourcing captures how women actually feel on a street at a given "
        "time. Combining both creates a stronger base for future hotspot identification than either "
        "source alone. The motivation for Phase 1 is to establish this dual data foundation before "
        "advanced analytics.",
    )

    h2(doc, "1.3 Scope of Phase 1")
    body(doc, "In scope (completed):")
    for item in [
        "OSM feature extraction and street-level safety scoring for Bengaluru BBMP areas (~46,000 streets, 53 zones).",
        "Classification of streets into safe / moderate / unsafe using a weighted multi-factor score.",
        "SafeHer mobile app for GPS-based safe/unsafe (and incident) reporting, community map, and SOS helplines.",
        "SafeHer public web site for browser-based reporting, map, and emergency assistance.",
        "SafeHer admin portal for OSM KPIs, BBMP area views, and Generated (OSM/synthetic) vs Real (crowdsourced) monitoring.",
        "Supabase schema for anonymous report storage, BBMP area matching, and basic anonymization practices.",
    ]:
        add_para(doc, "• " + item, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    body(doc, "Out of scope for this report (future work — not completed):")
    for item in [
        "Exploratory Data Analysis (EDA) as a finished analytical chapter.",
        "K-Means clustering for hotspot detection.",
        "Automated hotspot identification pipelines and heatmap dashboards as final analytical products.",
        "Full predictive policing or production-scale civic deployment.",
    ]:
        add_para(doc, "• " + item, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    h2(doc, "1.4 Objectives of Phase 1")
    for o in [
        "To extract relevant OSM infrastructure attributes for Bengaluru streets within BBMP zone bounding boxes.",
        "To compute transparent street safety scores and publish a reusable scored dataset.",
        "To build SafeHer so women can anonymously report safety perceptions and incidents with GPS context.",
        "To store crowdsourced reports in Supabase with area labels suitable for later hotspot analysis.",
        "To provide an admin view that can monitor OSM baseline metrics alongside incoming real reports.",
    ]:
        add_para(doc, "• " + o, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    # 2 LITERATURE
    h1(doc, "2. LITERATURE SURVEY")
    body(
        doc,
        "This section summarises selected works that inform Phase 1 design choices: GIS/hotspot theory, "
        "OSM-based environmental scoring, crowdsourced safety data, and women’s safety analytics apps.",
    )

    h2(doc, "2.1 GIS and Crime Hotspot Mapping")
    body(
        doc,
        "Chainey and Ratcliffe (2005) describe Geographic Information Systems (GIS) methods for crime "
        "mapping and hotspot detection, arguing that spatial visualisation helps agencies allocate "
        "resources. Sherman (1989) established that crime is concentrated at places rather than randomly "
        "spread, motivating place-based safety interventions. These works justify collecting street- and "
        "area-referenced data even before clustering is applied.",
    )

    h2(doc, "2.2 OSM and Environmental Safety Indicators")
    body(
        doc,
        "OpenStreetMap is widely used as volunteered geographic information for urban analytics. "
        "Environmental criminology and urban safety studies emphasise lighting, visibility, pedestrian "
        "infrastructure, and proximity to guardianship institutions (e.g., police, health facilities) as "
        "factors influencing perceived and actual safety (see also Nehme et al., 2017). Phase 1 adopts "
        "OSM tags and nearby Points of Interest (POIs) as proxies for such factors when computing street scores.",
    )

    h2(doc, "2.3 Crowdsourced Safety Data")
    body(
        doc,
        "Platforms such as Safetipin demonstrate that crowd-audited safety ratings can complement official "
        "statistics by capturing lived experience. Crowdsourcing requires careful anonymization, location "
        "precision trade-offs, and moderation status fields. SafeHer follows this model by collecting "
        "anonymous GPS-linked perceptions and incidents into a structured database for later analysis.",
    )

    h2(doc, "2.4 Women Safety Mobile Applications")
    body(
        doc,
        "Applications such as bSafe focus on SOS alerts and trusted-contact notification. While essential "
        "for emergencies, they typically do not produce an open, research-ready street dataset for a city. "
        "SafeHer includes SOS helplines but positions crowdsourced reporting and OSM scoring as the Phase 1 "
        "core contribution toward preventive analytics.",
    )

    h2(doc, "2.5 Gap Addressed by This Project")
    body(
        doc,
        "Existing tools are often either (a) emergency-only, (b) closed civic datasets, or (c) offline OSM "
        "notebooks without a live reporting channel. Phase 1 closes part of this gap by producing both an "
        "OSM-scored Bengaluru street dataset and a working SafeHer stack that continuously collects real "
        "reports. Advanced hotspot algorithms remain future work.",
    )

    # 3 SYSTEM DESIGN
    h1(doc, "3. SYSTEM DESIGN")
    h2(doc, "3.1 Overall Architecture")
    body(
        doc,
        "SafeHer and the OSM data pipeline form a client–server architecture with an offline data-science "
        "component. Citizens use mobile or web clients to submit reports. Supabase (PostgreSQL) stores "
        "crowdsourced records under row-level security policies. The admin portal reads OSM summary artefacts "
        "and live reports for monitoring. Map basemaps are served from OpenStreetMap tile providers.",
    )
    caption_fig(doc, "Fig. 3.1: High-level architecture of SafeHer and OSM data collection")
    add_para(
        doc,
        "[OSM Overpass Pipeline] → [Street Safety Dataset / Summary JSON]\n"
        "[Mobile App] + [Web User Site] → [Supabase reports] → [Admin Portal]\n"
        "[All clients] → [OSM Map Tiles]",
        size=11,
        align=WD_ALIGN_PARAGRAPH.CENTER,
        space_after=10,
    )

    h2(doc, "3.2 Mobile Application")
    body(
        doc,
        "The Android/Expo application provides Home, Report, Map, and SOS tabs. The Report flow requests "
        "location permission, resolves a BBMP area from GPS coordinates, allows the user to mark safe/unsafe "
        "or report an incident type, and submits an anonymous record to Supabase. The Map shows community "
        "report points. SOS lists helplines such as 112, 100, and 1091 and supports sharing live location.",
    )

    h2(doc, "3.3 Web User Site")
    body(
        doc,
        "The public Next.js website mirrors citizen features without login: landing page, report wizard, "
        "map, emergency/SOS page, and a simple safety overview. This lowers barriers for browser-based reporting.",
    )

    h2(doc, "3.4 Admin Portal")
    body(
        doc,
        "The password-protected admin portal is intended for the project team/analysts. It surfaces OSM "
        "street KPIs (counts, score distributions, BBMP coverage), area comparison views, and dashboards "
        "that distinguish Generated/OSM-oriented demonstration data from Real crowdsourced Supabase reports. "
        "It is a monitoring and inspection interface for Phase 1 data collection—not a finished hotspot "
        "prediction product.",
    )

    h2(doc, "3.5 Backend and Maps")
    body(
        doc,
        "Supabase hosts the reports table with insert policies for anonymous crowdsourcing and select "
        "policies limited to approved rows. Maps on web use Leaflet with OSM tiles; mobile uses "
        "react-native-maps. Area dictionaries shared across clients map lat/lon to BBMP zone names.",
    )

    # 4 DATA COLLECTION METHODOLOGY
    h1(doc, "4. DATA COLLECTION METHODOLOGY")
    h2(doc, "4.1 Part A — OSM Data Extraction")
    body(
        doc,
        "Bengaluru is partitioned into 53 BBMP area bounding boxes. For each box, a Python pipeline queries "
        "the Overpass API to retrieve highway/street geometries and nearby amenities relevant to safety "
        "context (e.g., bus stops, police, hospitals, lighting-related cues, CCTV-related tags where "
        "available). Responses are normalised into tabular street records with measured or inferred attributes.",
    )

    h2(doc, "4.2 Street Safety Scoring Methodology")
    body(
        doc,
        "Each street receives factor scores (approximately on a 0–10 style scale) for dimensions such as "
        "bus-stop density, police distance, hospital distance, CCTV presence, lighting, crowd/activity "
        "proxy from road class, commercial activity, night-activity proxy, and road/surface condition. "
        "A weighted sum produces an overall safety_score. Streets are then labelled safe, moderate, or "
        "unsafe using score thresholds. This yields the synthetic OSM-based scored dataset used as the "
        "infrastructure baseline (~46,000 streets).",
    )
    caption_table(doc, "Table 4.1: Illustrative scoring factors used in the OSM pipeline")
    add_table(
        doc,
        ["Factor", "Role in scoring"],
        [
            ["Lighting proxy", "Higher score when lighting-related cues suggest better night visibility"],
            ["Crowd / road class", "Busier road classes treated as relatively more observed/active"],
            ["Police / hospital distance", "Nearer emergency services improve the score"],
            ["Bus stops", "Transit access contributes positively within bounds"],
            ["CCTV-related signal", "Presence of mapped surveillance cues improves score"],
            ["Road/surface condition", "Better mapped surface/highway condition improves score"],
        ],
    )

    h2(doc, "4.3 Part B — SafeHer Crowdsourced Reporting")
    body(
        doc,
        "SafeHer collects real user contributions. A typical report includes latitude, longitude, matched "
        "BBMP area, whether the user feels safe, optional safety rating and environmental checkboxes "
        "(lighting, police nearby, CCTV seen, transport, harassment concern), optional incident type, "
        "time-of-day, and a short comment. Submissions are anonymous by default; a device identifier "
        "supports basic rate limiting (e.g., limited reports per hour per device).",
    )

    h2(doc, "4.4 Supabase Schema (Reports)")
    body(
        doc,
        "Live crowdsourced data is stored in a PostgreSQL reports table on Supabase. Core fields include "
        "id, created_at, lat, lon, area, is_safe, safety_rating, lighting_ok, crowd_level, police_nearby, "
        "cctv_seen, harassment_reported, transport_nearby, comment, time_of_day, reporter_id, device_id, "
        "and status (approved/pending/rejected). Later migrations add report_kind and incident_type for "
        "incident reporting. Row Level Security allows anonymous insert and public read of approved rows.",
    )
    caption_table(doc, "Table 4.2: Key fields in the Supabase reports table")
    add_table(
        doc,
        ["Field", "Purpose"],
        [
            ["lat, lon", "GPS coordinates of the report"],
            ["area", "Matched BBMP zone name"],
            ["is_safe", "User perception: safe vs unsafe"],
            ["incident_type / report_kind", "Optional incident classification"],
            ["device_id", "Anonymous device key for rate limiting"],
            ["status", "Moderation/publication state (default approved for Phase 1 demos)"],
        ],
    )

    h2(doc, "4.5 BBMP Zone Mapping")
    body(
        doc,
        "When a report is created, the client matches GPS coordinates to one of 53 BBMP area bounding boxes. "
        "If no box matches, a reverse-geocode fallback may be used. Consistent area labels allow OSM street "
        "aggregates and crowdsourced reports to be compared by zone in the admin portal.",
    )

    h2(doc, "4.6 Anonymization and Ethics")
    body(
        doc,
        "SafeHer does not require personal login for citizen reporting. Guidance asks users to avoid personal "
        "identifiers in free-text comments. Device IDs are opaque random strings. Location is used to derive "
        "area context for safety research; Phase 1 focuses on collection with privacy-minimising defaults. "
        "Future moderation workflows can move sensitive reports to pending status before public map display.",
    )

    # 5 WORK DONE
    h1(doc, "5. WORK DONE SO FAR (PHASE 1 COMPLETE)")
    h2(doc, "5.1 OSM-based Synthetic Street Safety Dataset")
    body(
        doc,
        "A Python pipeline (Overpass API + Pandas) was implemented to fetch OSM features for 53 BBMP areas, "
        "compute multi-factor safety scores, and export a Bengaluru street safety workbook/JSON summaries. "
        "Approximately 46,000 streets are scored and classified as safe, moderate, or unsafe. This dataset "
        "is the primary infrastructure data asset for forthcoming hotspot analysis phases.",
    )

    h2(doc, "5.2 SafeHer Application Built and Collecting Reports")
    body(
        doc,
        "SafeHer was implemented as three interfaces sharing one crowdsourcing backend:",
    )
    for item in [
        "Mobile (Expo/React Native): GPS reporting, BBMP matching, community map, SOS helplines (112, 100, 1091, etc.); Android debug APK produced for sharing.",
        "Web user site (Next.js, public): report, map, emergency, and overview pages without login.",
        "Admin portal (Next.js, password protected): OSM KPI dashboard, BBMP area comparison, Generated vs Real report inspection for data-collection monitoring.",
    ]:
        add_para(doc, "• " + item, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)
    body(
        doc,
        "Live crowdsourced reports are written to Supabase and can be viewed on community maps. This confirms "
        "that the collection channel is operational. Volume of real reports will grow with user testing; the "
        "OSM dataset already provides full city coverage for infrastructure baseline analysis.",
    )

    h2(doc, "5.3 Deliverables Summary")
    caption_table(doc, "Table 5.1: Phase 1 deliverables")
    add_table(
        doc,
        ["Deliverable", "Status"],
        [
            ["OSM street safety scored dataset (~46k streets, 53 BBMP zones)", "Completed"],
            ["SafeHer mobile app (report / map / SOS)", "Completed"],
            ["SafeHer web user site", "Completed"],
            ["SafeHer admin portal (OSM KPIs + Generated vs Real view)", "Completed"],
            ["Supabase reports storage + BBMP matching", "Completed"],
            ["EDA / K-Means hotspots / heatmap analytics product", "Not completed (Future Work)"],
        ],
    )

    # 6 FUTURE WORK
    h1(doc, "6. FUTURE WORK")
    body(
        doc,
        "Phase 1 establishes data foundations. Planned subsequent work includes:",
    )
    for item in [
        "Exploratory Data Analysis (EDA) on OSM scores and accumulated crowdsourced reports (distributions by area, time-of-day, incident type).",
        "K-Means (and related) clustering on spatial features to identify candidate hotspots.",
        "Hotspot identification combining infrastructure scores with real report density.",
        "Heatmap visualisation and an analyst-facing reporting dashboard beyond current collection monitoring.",
        "Stronger moderation, privacy reviews, and production Android signing for wider distribution.",
    ]:
        add_para(doc, "• " + item, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    # 7 CONCLUSION
    h1(doc, "7. CONCLUSION")
    body(
        doc,
        "Phase 1 of this PBL project successfully completed Data Collection through two tracks. First, an "
        "OpenStreetMap-based street safety scoring pipeline produced a large Bengaluru dataset spanning "
        "approximately 46,000 streets across 53 BBMP zones, labelled safe, moderate, or unsafe. Second, the "
        "SafeHer platform (mobile, web user, and admin) was built to collect real anonymous crowdsourced "
        "safety reports into Supabase with GPS and BBMP context, while offering SOS helplines and map views. "
        "Together, these deliverables provide the infrastructure and crowdsourced data channels required for "
        "later hotspot identification. EDA, K-Means clustering, hotspot models, and heatmap dashboards remain "
        "explicit future work and are not presented as completed outcomes in this report.",
    )

    # 8 REFERENCES
    h1(doc, "8. REFERENCES")
    refs = [
        "Chainey, S., & Ratcliffe, J. (2005). GIS and Crime Mapping. Wiley.",
        "Sherman, L. W. (1989). Hot Spots of Crime and Criminal Careers of Places. Criminology, 27(1), 27–56.",
        "Nehme, H., et al. (2017). Environmental and spatial factors influencing women’s safety in urban areas. Journal of Urban Studies (related literature).",
        "OpenStreetMap contributors. OpenStreetMap. https://www.openstreetmap.org",
        "Overpass API. https://wiki.openstreetmap.org/wiki/Overpass_API",
        "Safetipin. https://safetipin.com",
        "bSafe. https://www.getbsafe.com",
        "United Nations. Sustainable Development Goal 5. https://sdgs.un.org/goals/goal5",
        "Expo Documentation. https://docs.expo.dev",
        "Next.js Documentation. https://nextjs.org/docs",
        "Supabase Documentation. https://supabase.com/docs",
    ]
    for r in refs:
        add_para(doc, r, size=12, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=4)

    doc.save(str(OUT))
    print("Wrote", OUT)


if __name__ == "__main__":
    build()
