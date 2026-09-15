#!/usr/bin/env python3
"""Interim presentation for faculty review — navy/gold, audience-facing."""
from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt
from reportlab.lib.colors import HexColor, white, Color
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
OUT_PPTX = HERE / "SafeHer_Interim_Presentation.pptx"
OUT_PDF = HERE / "SafeHer_Interim_Presentation.pdf"

NAVY = RGBColor(0x0C, 0x23, 0x40)
NAVY2 = RGBColor(0x16, 0x3A, 0x5F)
GOLD = RGBColor(0xC4, 0xA3, 0x5A)
INK = RGBColor(0x1B, 0x24, 0x30)
MUTED = RGBColor(0x5A, 0x65, 0x70)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
BG = RGBColor(0xF4, 0xF6, 0xF8)
HIGH = RGBColor(0x8B, 0x1E, 0x3F)
MED = RGBColor(0xB4, 0x53, 0x09)
OK = RGBColor(0x1F, 0x6B, 0x4A)
STEEL = RGBColor(0x2E, 0x6B, 0x8A)
LINE = RGBColor(0xD6, 0xDC, 0xE2)

PN = HexColor("#0C2340")
P2 = HexColor("#163A5F")
PG = HexColor("#C4A35A")
PI = HexColor("#1B2430")
PM = HexColor("#5A6570")
PB = HexColor("#F4F6F8")
PH = HexColor("#8B1E3F")
PA = HexColor("#B45309")
PO = HexColor("#1F6B4A")

W, H = Inches(13.333), Inches(7.5)
PDF_SIZE = (13.333 * inch, 7.5 * inch)
TOTAL = 24


def _run(run, size=18, bold=False, color=INK):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = "Calibri"


def rect(slide, l, t, w, h, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    return sh


def rnd(slide, l, t, w, h, fill, line=None):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    if line is None:
        sh.line.fill.background()
    else:
        sh.line.color.rgb = line
        sh.line.width = Pt(1)
    return sh


def tb(slide, l, t, w, h, text, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    _run(run, size, bold, color)
    return box


def bullets(slide, l, t, w, h, items, size=14):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(8)
        run = p.add_run()
        run.text = "•  " + item
        _run(run, size, False, INK)
    return box


def footer(slide, n):
    rect(slide, Inches(0), Inches(7.28), W, Inches(0.22), NAVY)
    rect(slide, Inches(0), Inches(7.28), Inches(0.12), Inches(0.22), GOLD)
    tb(slide, Inches(0.35), Inches(7.28), Inches(10.4), Inches(0.22),
       "BMS Institute of Technology and Management  ·  Department of MCA  ·  Phase I Interim Review  ·  2025–27",
       10, False, WHITE)
    tb(slide, Inches(11.4), Inches(7.28), Inches(1.65), Inches(0.22),
       f"{n:02d}  /  {TOTAL:02d}", 10, False, GOLD, PP_ALIGN.RIGHT)


def header(slide, kicker, title, sub=None):
    rect(slide, Inches(0), Inches(0), W, Inches(0.08), GOLD)
    rect(slide, Inches(0), Inches(0.08), W, Inches(0.04), NAVY)
    tb(slide, Inches(0.5), Inches(0.22), Inches(12.3), Inches(0.26), kicker, 11, True, GOLD)
    tb(slide, Inches(0.5), Inches(0.46), Inches(12.3), Inches(0.46), title, 24, True, NAVY)
    if sub:
        tb(slide, Inches(0.5), Inches(0.94), Inches(12.3), Inches(0.34), sub, 13, False, MUTED)


def card(slide, l, t, w, h, title, body, accent=GOLD):
    rnd(slide, l, t, w, h, WHITE)
    rect(slide, l, t, Inches(0.07), h, accent)
    tb(slide, l + Inches(0.25), t + Inches(0.16), w - Inches(0.4), Inches(0.36), title, 14, True, NAVY)
    tb(slide, l + Inches(0.25), t + Inches(0.52), w - Inches(0.4), h - Inches(0.65), body, 12, False, MUTED)


def build_pptx():
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    blank = prs.slide_layouts[6]

    # 1 Title
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, NAVY)
    rect(s, Inches(0), Inches(0), Inches(0.14), H, GOLD)
    tb(s, Inches(0.7), Inches(0.48), Inches(12), Inches(0.28),
       "BMS INSTITUTE OF TECHNOLOGY AND MANAGEMENT", 12, True, GOLD)
    tb(s, Inches(0.7), Inches(0.82), Inches(12), Inches(0.28),
       "Department of Master of Computer Applications  ·  Project Work Phase I  ·  MMCA34  ·  2025–27",
       13, False, RGBColor(0xC5, 0xD0, 0xDB))
    rect(s, Inches(0.7), Inches(1.28), Inches(2.2), Inches(0.05), GOLD)
    tb(s, Inches(0.7), Inches(1.55), Inches(12.1), Inches(1.85),
       "Incident Analysis and Hotspot Identification\nfor Security Provision Against Women\nHarassment in Public Spaces",
       28, True, WHITE)
    tb(s, Inches(0.7), Inches(3.55), Inches(12), Inches(0.45),
       "SafeHer  —  a crowdsourced reporting system with geospatial analysis and a self-serve authority dashboard",
       15, False, RGBColor(0xD6, 0xC4, 0x8A))
    tb(s, Inches(0.7), Inches(4.55), Inches(6.4), Inches(2.0),
       "Submitted by\nAnusha K     1BY25MC017     Module 1 — Analysis and hotspot identification\nAman Yadav     1BY25MC012     Module 2 — Mobile application and dashboard",
       14, False, WHITE)
    tb(s, Inches(7.5), Inches(4.55), Inches(5.3), Inches(2.0),
       "Under the guidance of\nDr. M Sridevi\n\nAligned to SDG 5 — Gender Equality, Target 5.2",
       14, False, RGBColor(0xC5, 0xD0, 0xDB))
    footer(s, 1)

    # 2 Contents
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "CONTENTS", "Sequence of this review")
    rows = [
        ("01", "Organisation", "One project, two modules — who builds what"),
        ("02", "Problem and objectives", "The gap, and what we set out to do"),
        ("03", "End-to-end flow", "How a report becomes a map for an officer"),
        ("04", "Module 1 method", "Clean data → group nearby reports → score risk"),
        ("05", "Authority dashboard", "Maps, filters and a patrol list they open themselves"),
        ("06", "Security and results", "Who can see what, and the Karnataka numbers"),
    ]
    for i, (n, t, d) in enumerate(rows):
        col, row = i % 2, i // 2
        l, top = Inches(0.5 + col * 6.4), Inches(1.5 + row * 1.75)
        rnd(s, l, top, Inches(6.15), Inches(1.55), WHITE)
        tb(s, l + Inches(0.28), top + Inches(0.42), Inches(0.8), Inches(0.5), n, 20, True, GOLD)
        tb(s, l + Inches(1.15), top + Inches(0.35), Inches(4.7), Inches(0.4), t, 16, True, NAVY)
        tb(s, l + Inches(1.15), top + Inches(0.82), Inches(4.7), Inches(0.5), d, 13, False, MUTED)
    footer(s, 2)

    # 3 Organisation
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "PROJECT ORGANISATION", "One system. Two complementary modules.")
    card(s, Inches(0.45), Inches(1.5), Inches(6.15), Inches(5.2),
         "Module 1 — Anusha K  ·  1BY25MC017",
         "Incident analysis, geospatial clustering and hotspot identification.\n\n"
         "In data-science terms: ETL, spatial binning, density-based hotspots, rule-based risk.\n"
         "In everyday terms: we clean the list, group nearby reports, and colour the busy places.\n\n"
         "Folder: Module1_Analysis/\nCommand: python3 Module1_Analysis/pipeline.py\n\n"
         "The pipeline is rule-based and auditable. It does not predict crime.",
         GOLD)
    card(s, Inches(6.8), Inches(1.5), Inches(6.05), Inches(5.2),
         "Module 2 — Aman Yadav  ·  1BY25MC012",
         "Expo mobile application and Next.js authority dashboard.\n\n"
         "The application captures GPS, area, incident type and context, and writes to Supabase.\n\n"
         "The dashboard at /admin presents live community KPIs, analysis overlays, filters and alerts.\n\n"
         "Authorised officers retrieve the picture themselves. They do not wait for another desk to send a file.",
         STEEL)
    footer(s, 3)

    # 4 Problem
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "PROBLEM STATEMENT", "Street-level harassment is reported; concentrated locations are not available in time")
    card(s, Inches(0.45), Inches(1.48), Inches(4.05), Inches(5.25),
         "Present difficulty",
         "Incidents reach stations through registers, helplines or informal messages.\n\n"
         "A duty officer often depends on another person to compile “the latest list”.\n\n"
         "There is no shared map of where reports concentrate this week.\n\n"
         "Patrol planning therefore remains generic rather than location-specific.",
         HIGH)
    card(s, Inches(4.65), Inches(1.48), Inches(4.05), Inches(5.25),
         "Need",
         "Residents must be able to report from a telephone, with GPS, without filling a paper form first.\n\n"
         "Analysis must convert those points into hotspots and risk labels using published rules.\n\n"
         "Authorities must open one dashboard and obtain maps, filters and alerts without requesting data from the project team or from another desk.",
         GOLD)
    card(s, Inches(8.85), Inches(1.48), Inches(4.0), Inches(5.25),
         "Scope of this work",
         "Historical concentration of community reports — not crime prediction.\n\n"
         "No live police CCTV streams.\n\n"
         "No facial recognition.\n\n"
         "Karnataka State Police tables are used only as district-level context. They are never plotted as street dots.",
         STEEL)
    footer(s, 4)

    # 5 Objectives
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "OBJECTIVES", "What the system is built to achieve", "Aligned to SDG 5 — Gender Equality, Target 5.2 (eliminate violence against women)")
    objs = [
        ("01", "Collect", "Capture location, time, incident class and street context from the mobile application over HTTPS."),
        ("02", "Store", "Persist approved reports in a central table with Row Level Security so the public cannot read rejected rows."),
        ("03", "Analyse", "Clean, classify and cluster incident-like reports on a ~1 km grid; assign Low / Medium / High risk."),
        ("04", "Alert", "Produce a patrol list for High-risk or recently active cells, with area, coordinates and last seen."),
        ("05", "Present", "Give authorities a login-protected dashboard with filters, map layers and KPIs they operate themselves."),
        ("06", "Protect", "Keep reporting anonymous-first; keep the command view closed behind authentication."),
    ]
    for i, (n, t, b) in enumerate(objs):
        col, row = i % 3, i // 3
        l, top = Inches(0.45 + col * 4.25), Inches(1.5 + row * 2.6)
        rnd(s, l, top, Inches(4.1), Inches(2.4), WHITE)
        tb(s, l + Inches(0.22), top + Inches(0.22), Inches(0.7), Inches(0.4), n, 16, True, GOLD)
        tb(s, l + Inches(0.95), top + Inches(0.24), Inches(2.9), Inches(0.4), t, 16, True, NAVY)
        tb(s, l + Inches(0.22), top + Inches(0.78), Inches(3.7), Inches(1.4), b, 13, False, MUTED)
    footer(s, 5)

    # 6 Process image
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "END-TO-END PROCESS", "From a tap on the phone to a place on the officer’s map",
           "Each box is one stage. Arrows do not overlap. Gold line = data science term; grey line = everyday meaning.")
    s.shapes.add_picture(str(ASSETS / "safeher-pipeline.png"), Inches(0.28), Inches(1.36), width=Inches(12.75))
    footer(s, 6)

    # 7 Gathering
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "DATA GATHERING FROM THE APPLICATION", "The telephone is the sensor. Each successful submit starts the pipeline.")
    fields = [
        ("Location", "GPS latitude and longitude are captured automatically and matched to one of 30 Karnataka districts (example: Mysuru, Belagavi, Bengaluru Urban)."),
        ("Classification", "Safe / Unsafe. Incident-like rows are those marked unsafe, or flagged as harassment, or given an incident type."),
        ("Time", "Server timestamp (created_at) plus time of day: morning, afternoon, evening, night."),
        ("Street context", "Lighting, crowd level, CCTV seen, police nearby, transport nearby, optional comment."),
        ("Identity", "Name is not required. A device identifier is stored only to enforce a limit of five reports per hour."),
        ("Transport", "HTTPS insert into the Supabase table reports. Default status is approved; it may be held as pending."),
    ]
    y = 1.42
    for t, b in fields:
        rnd(s, Inches(0.45), Inches(y), Inches(12.4), Inches(0.88), WHITE)
        tb(s, Inches(0.65), Inches(y + 0.22), Inches(2.15), Inches(0.5), t, 14, True, NAVY)
        tb(s, Inches(2.9), Inches(y + 0.18), Inches(9.7), Inches(0.58), b, 13, False, MUTED)
        y += 0.92
    footer(s, 7)

    # 8 Two paths
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "HOW THE DASHBOARD STAYS CURRENT", "Two lanes, drawn separately — live counts, and hotspot analysis",
           "Path A updates in seconds. Path B redraws hotspots when Module 1 is run. Officers wait for neither.")
    s.shapes.add_picture(str(ASSETS / "safeher-two-paths.png"), Inches(0.35), Inches(1.32), width=Inches(12.6))
    footer(s, 8)

    # 9 Analysis steps
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "MODULE 1  ·  ANALYTICAL PIPELINE", "ETL, then spatial clustering, then rule-based risk — eight stages, none overlapping",
           "Logged in pipeline_log.json. This is descriptive analytics on historical reports, not a predictive model.")
    s.shapes.add_picture(str(ASSETS / "safeher-module1-flow.png"), Inches(0.28), Inches(1.32), width=Inches(12.75))
    footer(s, 9)

    # 10 How a hotspot is found
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "HOTSPOT IDENTIFICATION", "Spatial density on a 1 km grid — in data-science terms, support + recurrence",
           "Everyday meaning: if several reports sit in the same small square, often on different days, we mark that square.")
    s.shapes.add_picture(str(ASSETS / "safeher-hotspot-method.png"), Inches(0.28), Inches(1.32), width=Inches(12.75))
    footer(s, 10)

    # 11 Artefacts
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "ANALYSIS ARTEFACTS", "All required files live in Module1_Analysis/  —  OSM dumps and camera inventories are not part of this module")
    rnd(s, Inches(0.45), Inches(1.48), Inches(6.15), Inches(5.25), WHITE)
    tb(s, Inches(0.7), Inches(1.68), Inches(5.65), Inches(0.4), "Input  (Module1_Analysis/input/)", 16, True, NAVY)
    bullets(s, Inches(0.7), Inches(2.2), Inches(5.65), Inches(4.2), [
        "Dataset: PBL/Dataset/Karnataka — 30 districts, 604,573 OSM streets.",
        "reports.json — 1,079 approved app-schema demo reports across Karnataka.",
        "osm_districts.json — Safe / Moderate / Unsafe street counts per district.",
        "crime_context.json — KSP totals for all 30 districts. Not hotspot coordinates.",
        "SOURCES.json — provenance of each input.",
    ], 13)
    rnd(s, Inches(6.75), Inches(1.48), Inches(6.1), Inches(5.25), WHITE)
    tb(s, Inches(7.0), Inches(1.68), Inches(5.6), Inches(0.4), "Output  (Module1_Analysis/output/)", 16, True, NAVY)
    bullets(s, Inches(7.0), Inches(2.2), Inches(5.6), Inches(4.2), [
        "incident_view.json — classified incidents with 1 km cell.",
        "hotspots.json — 72 cells with count, type mix, peak time, recurrence, first/last seen.",
        "alerts.json — 55 patrol items with a location hint.",
        "areas.json — area-level risk joined to OSM scores.",
        "summary.json — counts and honesty notes.",
        "pipeline_log.json — step-by-step record of the last run.",
    ], 13)
    footer(s, 11)

    # 12 Risk
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "RISK STRATIFICATION", "Three if–then rules. An officer can defend the colour in a briefing.",
           "Technical name: rule-based scoring. Everyday meaning: red = look first, orange = watch, gold = note.")
    s.shapes.add_picture(str(ASSETS / "safeher-risk-flow.png"), Inches(0.28), Inches(1.32), width=Inches(12.75))
    footer(s, 12)

    # 13 Results
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "CURRENT ANALYSIS RESULT", "Descriptive statistics from the last Module 1 run  ·  Karnataka  ·  not a forecast",
           "Everyday meaning: of 1,079 demo reports, 534 were “something happened”; 72 small squares on the map stood out.")
    kpis = [("1079", "Reports after clean", NAVY), ("534", "Incident-like", HIGH),
            ("72", "Hotspot cells", MED), ("55", "Patrol alerts", OK)]
    for i, (n, lab, c) in enumerate(kpis):
        rnd(s, Inches(0.5 + i * 3.2), Inches(1.45), Inches(3.0), Inches(1.55), WHITE)
        tb(s, Inches(0.5 + i * 3.2), Inches(1.58), Inches(3.0), Inches(0.75), n, 32, True, c, PP_ALIGN.CENTER)
        tb(s, Inches(0.5 + i * 3.2), Inches(2.35), Inches(3.0), Inches(0.42), lab, 13, False, MUTED, PP_ALIGN.CENTER)
    tb(s, Inches(0.5), Inches(3.2), Inches(12), Inches(0.32), "Risk split of the 72 hotspot cells", 14, True, NAVY)
    for i, (lab, c) in enumerate([("High    30", HIGH), ("Medium    19", MED), ("Low    23", STEEL)]):
        rnd(s, Inches(0.5 + i * 2.55), Inches(3.58), Inches(2.4), Inches(0.5), c)
        tb(s, Inches(0.5 + i * 2.55), Inches(3.64), Inches(2.4), Inches(0.4), lab, 13, True, WHITE, PP_ALIGN.CENTER)
    tb(s, Inches(0.5), Inches(4.3), Inches(12.3), Inches(2.5),
       "Highest incident-like districts in this run: Kolar (31), Bengaluru Urban (27), Mandya (26), Tumakuru (26), Belagavi (25), Kalaburagi (25).\n"
       "Time of day among incident-like reports is even — morning 143, afternoon 140, evening 119, night 132 — so night is not the only pattern.\n"
       "Type mix: unsafe feeling 287  ·  harassment 247. Preprocess dropped 0 duplicates and 0 invalid coordinates.\n"
       "OSM layer: 604,573 Karnataka streets, avg score 4.16. Live app rows go in live_reports.json; the same pipeline is re-run.",
       14, False, MUTED)
    footer(s, 13)

    # 14 Self-serve
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "SELF-SERVE FOR AUTHORITIES", "The dashboard is the source. Officers do not depend on anyone to send them data.")
    points = [
        ("Independent access", "An authorised officer logs in at /admin. Maps, KPIs, hotspots and alerts are already loaded."),
        ("No request to another desk", "Filters replace a request for last week’s spreadsheet. Area, incident type, date, time of day and risk are selected on screen."),
        ("One operational picture", "OSM infrastructure, community reports and analysis circles sit on the same map."),
        ("Actionable output", "Each High-risk cell carries a patrol hint: area, coordinates and last seen — ready for the day’s briefing."),
        ("Stable rules", "Risk labels come from the published pipeline, not from whoever last coloured a sheet."),
        ("Audit trail", "Every hotspot stores count, type mix, peak time, first seen and last seen."),
    ]
    for i, (t, b) in enumerate(points):
        col, row = i % 3, i // 3
        card(s, Inches(0.45 + col * 4.25), Inches(1.48 + row * 2.6), Inches(4.1), Inches(2.4), t, b, GOLD if row == 0 else NAVY2)
    footer(s, 14)

    # 15 Workflow
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "AUTHORITY WORKFLOW", "Intended morning use. No telephone call is required to obtain the data.")
    steps = [
        ("01", "Authenticate", "The officer signs in at /admin. The session is an HttpOnly cookie. Sign-out clears it."),
        ("02", "Read the KPIs", "Hotspot count, High-risk cells and alert count indicate whether the day is ordinary or elevated."),
        ("03", "Filter", "Area, incident type, from/to date, time of day and risk. The table and the map follow the same filters."),
        ("04", "Brief and act", "High circles are inspected on the map. Patrol hints are copied into the day’s briefing."),
    ]
    for i, (n, t, b) in enumerate(steps):
        l = Inches(0.4 + i * 3.22)
        rnd(s, l, Inches(1.55), Inches(3.05), Inches(5.15), WHITE)
        tb(s, l + Inches(0.2), Inches(1.8), Inches(2.65), Inches(0.4), n, 18, True, GOLD)
        tb(s, l + Inches(0.2), Inches(2.3), Inches(2.65), Inches(0.7), t, 18, True, NAVY)
        tb(s, l + Inches(0.2), Inches(3.1), Inches(2.65), Inches(3.2), b, 14, False, MUTED)
    footer(s, 15)

    # 16 Security image
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "SECURITY OVERVIEW", "Anonymous-first reporting. Closed command view.")
    s.shapes.add_picture(str(ASSETS / "safeher-security.png"), Inches(0.35), Inches(1.32), width=Inches(12.6))
    footer(s, 16)

    # 17 Security detail
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "SECURITY CONTROLS IMPLEMENTED", "These controls exist in the current codebase. They are not a future proposal.")
    card(s, Inches(0.45), Inches(1.48), Inches(6.15), Inches(5.25),
         "Public reporting",
         "No name, telephone number or photograph is required.\n\n"
         "A device identifier is used only to cap five reports per hour.\n\n"
         "Transport is HTTPS into Supabase.\n\n"
         "Row Level Security: insert is allowed; SELECT is allowed only where status = approved. Rejected rows never appear on maps.\n\n"
         "GPS places the report. The system does not retain a tracking trail of the reporter.",
         OK)
    card(s, Inches(6.8), Inches(1.48), Inches(6.05), Inches(5.25),
         "Authority dashboard",
         "Next.js middleware blocks every /admin route except login unless a valid session cookie is present.\n\n"
         "The password is checked on the server. ADMIN_PASSWORD is an environment variable, not a client constant.\n\n"
         "The session cookie is HttpOnly, SameSite=Lax, Secure in production, with a seven-day expiry.\n\n"
         "Sign-out deletes the session.\n\n"
         "Officers see locations and aggregates. Reporter identities cannot be disclosed because they are not stored.",
         NAVY2)
    footer(s, 17)

    # 18 App report
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "MOBILE APPLICATION", "Four steps: location  →  what happened  →  details  →  confirmation")
    s.shapes.add_picture(str(ASSETS / "safeher-app-report.png"), Inches(0.4), Inches(1.32), height=Inches(5.8))
    bullets(s, Inches(5.55), Inches(1.55), Inches(7.3), Inches(5.4), [
        "Tabs: Home, Report, Map, SOS.",
        "Built with Expo so the same codebase targets iOS and Android.",
        "The Karnataka district is confirmed from GPS before submit.",
        "Incident types are requested only when something happened.",
        "Context fields: lighting, crowd, CCTV, police, transport, optional comment.",
        "SOS keeps helpline numbers one tap away.",
        "A successful submit is the start of the whole pipeline.",
    ], 15)
    footer(s, 18)

    # 19 App map
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "MOBILE APPLICATION  ·  COMMUNITY MAP", "Residents see community signal. The command view remains on /admin.")
    s.shapes.add_picture(str(ASSETS / "safeher-app-map.png"), Inches(0.4), Inches(1.32), height=Inches(5.8))
    bullets(s, Inches(5.55), Inches(1.55), Inches(7.3), Inches(5.4), [
        "Green markers indicate a safe feeling.",
        "Red markers indicate unsafe or incident-like reports.",
        "Larger circles mark analysis hotspots.",
        "Demo points are labelled so live police data is not implied.",
        "Filters, patrol alerts and full KPIs are reserved for authenticated officers.",
    ], 15)
    footer(s, 19)

    # 20 Dashboard filters
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "AUTHORITY DASHBOARD  ·  FILTERS",
           "Area  ·  incident type  ·  date range  ·  time of day  ·  risk  ·  reset  —  table and map follow the same selection")
    s.shapes.add_picture(str(ASSETS / "safeher-dashboard-filters.png"), Inches(0.35), Inches(1.35), width=Inches(12.6))
    footer(s, 20)

    # 21 Dashboard map
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "AUTHORITY DASHBOARD  ·  MAP", "Streets, community reports and analysis hotspots on one screen")
    s.shapes.add_picture(str(ASSETS / "safeher-hotspots-map.png"), Inches(0.3), Inches(1.32), width=Inches(8.45))
    bullets(s, Inches(8.95), Inches(1.55), Inches(4.0), Inches(5.3), [
        "Each layer can be toggled.",
        "Filters match the hotspot table.",
        "A circle shows area, count, peak time and risk.",
        "The patrol hint is available for the briefing.",
        "GIS export from another team is not required.",
    ], 14)
    footer(s, 21)

    # 22 Honesty
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "DATA SOURCES AND LIMITATIONS", "What each layer is, and what it is not")
    rows = [
        ("OSM streets and camera locations", "Observed geography", "604,573 Karnataka streets across 30 districts; 5,578 cameras. Used as infrastructure context."),
        ("Street safety score", "Modelled proxy", "Nine infrastructure factors. Statewide average 4.16 / 10. It is not a crime rate."),
        ("Application reports (this run)", "Synthetic, live-ready", "1,079 demo rows across 30 districts. Live rows use the same table and the same pipeline."),
        ("Hotspots and alerts", "Derived", "1 km clusters of incident-like reports. Historical concentration, not a forecast."),
        ("KSP 2023–24 tables", "Official, district grain", "All 30 Karnataka districts. Never drawn as street dots."),
        ("CCTV video", "Out of scope", "Camera locations may be shown. Live Safe City streams are not used."),
    ]
    y = 1.42
    for a, b, c in rows:
        rnd(s, Inches(0.4), Inches(y), Inches(12.5), Inches(0.88), WHITE)
        tb(s, Inches(0.58), Inches(y + 0.22), Inches(3.7), Inches(0.5), a, 13, True, NAVY)
        tb(s, Inches(4.4), Inches(y + 0.22), Inches(2.45), Inches(0.5), b, 13, True, GOLD)
        tb(s, Inches(6.95), Inches(y + 0.16), Inches(5.7), Inches(0.6), c, 12, False, MUTED)
        y += 0.92
    footer(s, 22)

    # 23 Status
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, BG)
    header(s, "STATUS AT INTERIM", "The process is defined and implemented for local demonstration")
    rnd(s, Inches(0.45), Inches(1.48), Inches(6.15), Inches(5.25), WHITE)
    tb(s, Inches(0.7), Inches(1.68), Inches(5.65), Inches(0.4), "Completed", 18, True, OK)
    bullets(s, Inches(0.7), Inches(2.2), Inches(5.65), Inches(4.2), [
        "Shared title, module split and synopsis.",
        "OSM infrastructure dataset for Karnataka (30 districts, 604,573 streets).",
        "Application schema, HTTPS submit and Row Level Security.",
        "Analysis pipeline with self-check: 72 hotspots, 55 alerts, 30 districts.",
        "Authority dashboard: login, filters, hotspots, map.",
        "Security: anonymous reports, rate limit, admin session cookie.",
    ], 14)
    rnd(s, Inches(6.8), Inches(1.48), Inches(6.05), Inches(5.25), WHITE)
    tb(s, Inches(7.05), Inches(1.68), Inches(5.55), Inches(0.4), "Remaining after interim", 18, True, MED)
    bullets(s, Inches(7.05), Inches(2.2), Inches(5.55), Inches(4.2), [
        "Run the Expo application and Next.js dashboard live in the laboratory.",
        "Feed live approved rows into Module1_Analysis/input/live_reports.json on a schedule.",
        "Optional: hold new reports as pending until moderation.",
        "Public store deployment is optional. It is not required to demonstrate the process.",
    ], 14)
    footer(s, 23)

    # 24 Thanks
    s = prs.slides.add_slide(blank)
    rect(s, Inches(0), Inches(0), W, H, NAVY)
    rect(s, Inches(0), Inches(0), Inches(0.14), H, GOLD)
    tb(s, Inches(0.8), Inches(2.05), Inches(12), Inches(0.7), "Thank you", 40, True, WHITE)
    rect(s, Inches(0.8), Inches(2.85), Inches(1.8), Inches(0.05), GOLD)
    tb(s, Inches(0.8), Inches(3.15), Inches(11.8), Inches(0.9),
       "SafeHer gives authorities maps, filters and patrol alerts they can retrieve themselves —\nwithout depending on anyone else to send the data.",
       16, False, RGBColor(0xD6, 0xC4, 0x8A))
    tb(s, Inches(0.8), Inches(4.4), Inches(12), Inches(1.6),
       "Anusha K  ·  1BY25MC017          Aman Yadav  ·  1BY25MC012\nGuide: Dr. M Sridevi          Department of MCA, BMS Institute of Technology and Management",
       15, False, WHITE)
    footer(s, 24)


def wrap(text, n):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) <= n:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def pdf_footer(c, n):
    w, h = PDF_SIZE
    c.setFillColor(PN)
    c.rect(0, 0, w, 0.22 * inch, fill=1, stroke=0)
    c.setFillColor(PG)
    c.rect(0, 0, 0.12 * inch, 0.22 * inch, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica", 8)
    c.drawString(0.35 * inch, 0.07 * inch, "BMS Institute of Technology and Management  ·  Department of MCA  ·  Phase I Interim Review  ·  2025-27")
    c.setFillColor(PG)
    c.drawRightString(w - 0.3 * inch, 0.07 * inch, f"{n:02d} / {TOTAL:02d}")


def pdf_header(c, kicker, title, sub=None):
    w, h = PDF_SIZE
    c.setFillColor(PG)
    c.rect(0, h - 0.08 * inch, w, 0.08 * inch, fill=1, stroke=0)
    c.setFillColor(PN)
    c.rect(0, h - 0.12 * inch, w, 0.04 * inch, fill=1, stroke=0)
    c.setFillColor(PG)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.5 * inch, h - 0.4 * inch, kicker)
    c.setFillColor(PN)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(0.5 * inch, h - 0.72 * inch, title)
    if sub:
        c.setFillColor(PM)
        c.setFont("Helvetica", 10)
        c.drawString(0.5 * inch, h - 1.02 * inch, sub)


def rr(c, x, y, w, h, fill):
    c.setFillColor(fill)
    c.roundRect(x, y, w, h, 6, fill=1, stroke=0)


def build_pdf():
    w, h = PDF_SIZE
    c = canvas.Canvas(str(OUT_PDF), pagesize=PDF_SIZE)

    def bg():
        c.setFillColor(PB)
        c.rect(0, 0, w, h, fill=1, stroke=0)

    # 1
    c.setFillColor(PN)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(PG)
    c.rect(0, 0, 0.14 * inch, h, fill=1, stroke=0)
    c.setFillColor(PG)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.7 * inch, h - 0.65 * inch, "BMS INSTITUTE OF TECHNOLOGY AND MANAGEMENT")
    c.setFillColor(HexColor("#C5D0DB"))
    c.setFont("Helvetica", 11)
    c.drawString(0.7 * inch, h - 0.95 * inch, "Department of MCA  ·  Project Work Phase I  ·  MMCA34  ·  2025-27")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    y = h - 1.7 * inch
    for line in ["Incident Analysis and Hotspot Identification",
                 "for Security Provision Against Women",
                 "Harassment in Public Spaces"]:
        c.drawString(0.7 * inch, y, line)
        y -= 0.36 * inch
    c.setFillColor(HexColor("#D6C48A"))
    c.setFont("Helvetica", 11)
    c.drawString(0.7 * inch, 3.55 * inch, "SafeHer  -  crowdsourced reporting, geospatial analysis, self-serve authority dashboard")
    c.setFillColor(white)
    c.setFont("Helvetica", 11)
    c.drawString(0.7 * inch, 2.55 * inch, "Anusha K  1BY25MC017   Module 1  Analysis and hotspot identification")
    c.drawString(0.7 * inch, 2.25 * inch, "Aman Yadav  1BY25MC012   Module 2  Mobile application and dashboard")
    c.setFillColor(HexColor("#C5D0DB"))
    c.drawString(0.7 * inch, 1.8 * inch, "Guide: Dr. M Sridevi     SDG 5 Gender Equality, Target 5.2")
    pdf_footer(c, 1)
    c.showPage()

    def page_cards(kicker, title, sub, items, n):
        bg()
        pdf_header(c, kicker, title, sub)
        y = h - 1.5 * inch
        for item in items:
            rr(c, 0.45 * inch, y - 0.78 * inch, 12.4 * inch, 0.84 * inch, white)
            c.setFillColor(PI)
            c.setFont("Helvetica", 11)
            t = c.beginText(0.7 * inch, y - 0.28 * inch)
            t.setLeading(14)
            for line in wrap(item, 112):
                t.textLine(line)
            c.drawText(t)
            y -= 0.9 * inch
        pdf_footer(c, n)
        c.showPage()

    page_cards("CONTENTS", "Sequence of this review", None, [
        "01  Organisation - one project, two modules, who builds what.",
        "02  Problem and objectives - the gap, and what we set out to do.",
        "03  End-to-end flow - how a report becomes a map for an officer.",
        "04  Module 1 method - clean data, group nearby reports, score risk.",
        "05  Authority dashboard - maps, filters and a patrol list they open themselves.",
        "06  Security and results - who can see what, and the Karnataka numbers.",
    ], 2)

    page_cards("PROJECT ORGANISATION", "One system. Two complementary modules.", None, [
        "Module 1 (Anusha K, 1BY25MC017): incident analysis, geospatial clustering, hotspot identification. Folder Module1_Analysis/. Command python3 Module1_Analysis/pipeline.py.",
        "Inputs: app reports, OSM area scores, KSP district context. Outputs: incident view, hotspots, area risk, patrol alerts. Rule-based. Not crime prediction.",
        "Module 2 (Aman Yadav, 1BY25MC012): Expo mobile application and Next.js authority dashboard at /admin.",
        "Authorised officers retrieve maps, filters and alerts themselves. They do not wait for another desk to send a file.",
    ], 3)

    page_cards("PROBLEM STATEMENT", "Concentrated locations are not available in time", None, [
        "Incidents reach stations through registers, helplines or informal messages. A duty officer often depends on another person for the latest list.",
        "Need: GPS reporting from a telephone; analysis into hotspots with published rules; one dashboard that authorities operate themselves.",
        "Scope: historical concentration, not prediction. No live CCTV. No facial recognition. KSP tables are district context only.",
    ], 4)

    page_cards("OBJECTIVES", "Aligned to SDG 5, Target 5.2", None, [
        "Collect location, time, incident class and street context from the mobile application over HTTPS.",
        "Store approved reports with Row Level Security so the public cannot read rejected rows.",
        "Analyse: clean, classify, cluster on a ~1 km grid, assign Low / Medium / High.",
        "Alert: patrol list for High-risk or recently active cells, with area, coordinates and last seen.",
        "Present a login-protected dashboard with filters, map layers and KPIs.",
        "Protect: anonymous-first reporting; closed command view.",
    ], 5)

    bg(); pdf_header(c, "END-TO-END PROCESS", "From a tap on the phone to a place on the officer's map", "Each box is one stage. Gold = data-science term. Grey = everyday meaning.")
    c.drawImage(str(ASSETS / "safeher-pipeline.png"), 0.28 * inch, 0.38 * inch, width=12.75 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 6); c.showPage()

    page_cards("DATA GATHERING", "The telephone is the sensor", "Each successful submit starts the pipeline", [
        "Location - GPS latitude and longitude, matched to one of 30 Karnataka districts.",
        "Classification - Safe / Unsafe. Incident-like = unsafe, harassment flag, or incident type.",
        "Time - server timestamp plus morning / afternoon / evening / night.",
        "Street context - lighting, crowd, CCTV seen, police nearby, transport, optional comment.",
        "Identity - name is not required. Device identifier only, to cap five reports per hour.",
        "Transport - HTTPS insert into Supabase reports. Default status approved; may be held pending.",
    ], 7)

    bg(); pdf_header(c, "HOW THE DASHBOARD STAYS CURRENT", "Two lanes, drawn separately", "Path A = live counts. Path B = hotspot analysis. They do not wait on each other.")
    c.drawImage(str(ASSETS / "safeher-two-paths.png"), 0.35 * inch, 0.35 * inch, width=12.6 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 8); c.showPage()

    bg(); pdf_header(c, "MODULE 1  ANALYTICAL PIPELINE", "ETL, spatial clustering, rule-based risk", "Eight stages. Descriptive analytics on historical reports, not a predictive model.")
    c.drawImage(str(ASSETS / "safeher-module1-flow.png"), 0.28 * inch, 0.32 * inch, width=12.75 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 9); c.showPage()

    bg(); pdf_header(c, "HOTSPOT IDENTIFICATION", "Spatial density on a 1 km grid", "If several reports sit in the same small square, often on different days, we mark that square.")
    c.drawImage(str(ASSETS / "safeher-hotspot-method.png"), 0.28 * inch, 0.32 * inch, width=12.75 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 10); c.showPage()

    page_cards("ANALYSIS ARTEFACTS", "All required files live in Module1_Analysis/", "OSM dumps and camera inventories are excluded", [
        "Input: Karnataka OSM District Summary (604,573 streets, 30 districts), reports.json (1,079 demo), live_reports.json, crime_context.json (KSP, all districts).",
        "Output: incident_view.json, hotspots.json, alerts.json, areas.json, summary.json, pipeline_log.json.",
        "Dashboard copies: summary, hotspots, alerts, areas under web/public/data/analysis/.",
    ], 11)

    bg(); pdf_header(c, "RISK STRATIFICATION", "Three if-then rules. Not a machine-learning black box.", "Red = look first. Orange = watch. Navy = note.")
    c.drawImage(str(ASSETS / "safeher-risk-flow.png"), 0.28 * inch, 0.32 * inch, width=12.75 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 12); c.showPage()

    bg(); pdf_header(c, "CURRENT ANALYSIS RESULT", "Descriptive statistics  ·  Karnataka  ·  not a forecast")
    kpis = [("1079", "Reports"), ("534", "Incident-like"), ("72", "Hotspots"), ("55", "Alerts")]
    cols = [PN, PH, PA, PO]
    for i, ((n, lab), col) in enumerate(zip(kpis, cols)):
        x = 0.5 * inch + i * 3.2 * inch
        rr(c, x, 4.9 * inch, 3.0 * inch, 1.5 * inch, white)
        c.setFillColor(col); c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(x + 1.5 * inch, 5.7 * inch, n)
        c.setFillColor(PM); c.setFont("Helvetica", 11)
        c.drawCentredString(x + 1.5 * inch, 5.2 * inch, lab)
    c.setFillColor(PI); c.setFont("Helvetica", 11)
    c.drawString(0.5 * inch, 4.45 * inch, "Risk split: High 30    Medium 19    Low 23")
    c.setFillColor(PM)
    for i, line in enumerate([
        "Highest incident-like districts: Kolar 31, Bengaluru Urban 27, Mandya 26, Tumakuru 26, Belagavi 25.",
        "Time of day is even - morning 143, afternoon 140, evening 119, night 132. Type mix: unsafe feeling 287, harassment 247.",
        "OSM: 604,573 Karnataka streets, avg score 4.16. Preprocess dropped 0 duplicates.",
        "Live rows in Module1_Analysis/input/live_reports.json use the same pipeline.",
    ]):
        c.drawString(0.5 * inch, 4.1 * inch - i * 0.32 * inch, line)
    pdf_footer(c, 13); c.showPage()

    page_cards("SELF-SERVE FOR AUTHORITIES", "Officers do not depend on anyone to send them data", None, [
        "Independent access - login at /admin; maps, KPIs, hotspots and alerts are already loaded.",
        "No request to another desk - filters replace a request for last week's spreadsheet.",
        "One operational picture - OSM streets, community reports and analysis circles.",
        "Actionable - High-risk cells carry area, coordinates and last seen.",
        "Stable rules - risk comes from the published pipeline. Each hotspot stores count, type mix, peak time, first and last seen.",
    ], 14)

    page_cards("AUTHORITY WORKFLOW", "Intended morning use", None, [
        "01 Authenticate - sign in at /admin. HttpOnly cookie. Sign-out clears the session.",
        "02 Read the KPIs - hotspot count, High-risk cells, alert count.",
        "03 Filter - area, incident type, from/to date, time of day, risk. Table and map follow.",
        "04 Brief and act - inspect High circles; copy patrol hints into the day's briefing.",
    ], 15)

    bg(); pdf_header(c, "SECURITY OVERVIEW", "Anonymous-first reporting. Closed command view.")
    c.drawImage(str(ASSETS / "safeher-security.png"), 0.35 * inch, 0.38 * inch, width=12.6 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 16); c.showPage()

    page_cards("SECURITY CONTROLS IMPLEMENTED", "Present in the current codebase", None, [
        "No name, telephone or photograph required. Device identifier only, to cap five reports per hour. HTTPS to Supabase.",
        "Row Level Security: insert allowed; public SELECT only where status = approved. Rejected rows never map.",
        "GPS places the report. No tracking trail of the reporter is retained.",
        "Dashboard: middleware blocks /admin without a valid session. Password checked on the server. ADMIN_PASSWORD is an environment variable.",
        "Cookie: HttpOnly, SameSite=Lax, Secure in production, seven-day expiry. Sign-out deletes the session.",
        "Officers see locations and aggregates. Identities are not stored and therefore cannot be disclosed.",
    ], 17)

    bg(); pdf_header(c, "MOBILE APPLICATION", "Location, classification, details, confirmation")
    c.drawImage(str(ASSETS / "safeher-app-report.png"), 0.4 * inch, 0.4 * inch, height=6.3 * inch, preserveAspectRatio=True, mask="auto")
    c.setFillColor(PI); c.setFont("Helvetica", 11)
    y = 5.9 * inch
    for line in ["Home, Report, Map, SOS", "Expo - iOS and Android", "GPS area before submit", "Incident types only if needed", "SOS helplines one tap away", "Submit starts the pipeline"]:
        c.drawString(5.7 * inch, y, "-  " + line); y -= 0.38 * inch
    pdf_footer(c, 18); c.showPage()

    bg(); pdf_header(c, "MOBILE APPLICATION  -  COMMUNITY MAP", "Residents see community signal; command view is on /admin")
    c.drawImage(str(ASSETS / "safeher-app-map.png"), 0.4 * inch, 0.4 * inch, height=6.3 * inch, preserveAspectRatio=True, mask="auto")
    c.setFillColor(PI); c.setFont("Helvetica", 11)
    y = 5.9 * inch
    for line in ["Green = safe feeling", "Red = unsafe / incident", "Circle = analysis hotspot", "Demo points are labelled", "Filters and alerts stay on /admin"]:
        c.drawString(5.7 * inch, y, "-  " + line); y -= 0.38 * inch
    pdf_footer(c, 19); c.showPage()

    bg(); pdf_header(c, "AUTHORITY DASHBOARD  -  FILTERS", "Area, type, date, time of day, risk - table and map follow")
    c.drawImage(str(ASSETS / "safeher-dashboard-filters.png"), 0.4 * inch, 0.38 * inch, width=12.5 * inch, preserveAspectRatio=True, mask="auto")
    pdf_footer(c, 20); c.showPage()

    bg(); pdf_header(c, "AUTHORITY DASHBOARD  -  MAP", "Streets, community reports, analysis hotspots")
    c.drawImage(str(ASSETS / "safeher-hotspots-map.png"), 0.3 * inch, 0.38 * inch, width=8.4 * inch, preserveAspectRatio=True, mask="auto")
    c.setFillColor(PI); c.setFont("Helvetica", 11)
    y = 5.7 * inch
    for line in ["Toggle each layer", "Same filters as the table", "Click: count, peak time, risk", "Patrol hint for the briefing", "No GIS export required"]:
        c.drawString(8.95 * inch, y, "-  " + line); y -= 0.38 * inch
    pdf_footer(c, 21); c.showPage()

    page_cards("DATA SOURCES AND LIMITATIONS", "What each layer is, and what it is not", None, [
        "OSM streets and camera locations - observed geography (604,573 Karnataka streets, 30 districts).",
        "Street safety score - modelled nine-factor proxy, not a crime rate.",
        "This run's reports - 1,079 synthetic rows across 30 districts; live uses the same table and pipeline.",
        "Hotspots - derived 1 km clusters. Historical concentration, not a forecast.",
        "KSP tables - official, district grain, never street dots.",
        "CCTV video - out of scope.",
    ], 22)

    page_cards("STATUS AT INTERIM", "Process defined and implemented for local demonstration", None, [
        "Completed: synopsis, Karnataka OSM dataset, analysis self-check (72 hotspots, 55 alerts across 30 districts).",
        "Current numbers: 1,079 reports -> 534 incident-like -> 72 hotspots (30 High) -> 55 alerts.",
        "Remaining: live Expo/Next in the laboratory; optional timer to refresh analysis; optional pending-moderation.",
        "Public store deployment is optional and not required to demonstrate the process.",
    ], 23)

    c.setFillColor(PN)
    c.rect(0, 0, w, h, fill=1, stroke=0)
    c.setFillColor(PG)
    c.rect(0, 0, 0.14 * inch, h, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 34)
    c.drawString(0.8 * inch, 4.5 * inch, "Thank you")
    c.setFillColor(HexColor("#D6C48A"))
    c.setFont("Helvetica", 12)
    c.drawString(0.8 * inch, 3.95 * inch, "Authorities retrieve maps, filters and alerts themselves - without depending on anyone to send the data.")
    c.setFillColor(white)
    c.setFont("Helvetica", 12)
    c.drawString(0.8 * inch, 2.7 * inch, "Anusha K  ·  1BY25MC017          Aman Yadav  ·  1BY25MC012")
    c.drawString(0.8 * inch, 2.35 * inch, "Guide: Dr. M Sridevi          Department of MCA, BMS Institute of Technology and Management")
    pdf_footer(c, 24)
    c.save()


if __name__ == "__main__":
    build_pptx()
    build_pdf()
    print("Wrote", OUT_PPTX)
    print("Wrote", OUT_PDF)
