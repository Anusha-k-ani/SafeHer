#!/usr/bin/env python3
"""PDF dictionary for karnataka_street_safety.xlsx — every column, values, scoring."""
from __future__ import annotations

import shutil
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

HERE = Path(__file__).resolve().parent
OUT = HERE / "Karnataka_Street_Safety_Feature_Guide.pdf"
COPY = HERE.parent / "Karnataka_Streetwise" / "Karnataka_Street_Safety_Feature_Guide.pdf"

NAVY = HexColor("#0C2340")
GOLD = HexColor("#C4A35A")
INK = HexColor("#1B2430")
MUTED = HexColor("#5A6570")
PALE = HexColor("#F4F6F8")
LINE = HexColor("#D6DCE2")


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle(name="Kicker", fontName="Times-Bold", fontSize=9, textColor=GOLD, spaceAfter=2))
    ss.add(ParagraphStyle(name="H1", fontName="Times-Bold", fontSize=16, textColor=NAVY, spaceBefore=10, spaceAfter=8, leading=20))
    ss.add(ParagraphStyle(name="H2", fontName="Times-Bold", fontSize=12.5, textColor=NAVY, spaceBefore=11, spaceAfter=6, leading=16))
    ss.add(ParagraphStyle(name="H3", fontName="Times-Bold", fontSize=11, textColor=NAVY, spaceBefore=8, spaceAfter=4, leading=14))
    ss.add(ParagraphStyle(name="Body", fontName="Times-Roman", fontSize=10.5, textColor=INK, leading=15, alignment=TA_JUSTIFY, spaceAfter=6))
    ss.add(ParagraphStyle(name="NoteBullet", fontName="Times-Roman", fontSize=10.5, textColor=INK, leading=14.5, leftIndent=14, spaceAfter=3))
    ss.add(ParagraphStyle(name="Caption", fontName="Times-Italic", fontSize=9, textColor=MUTED, leading=12, spaceAfter=8))
    ss.add(ParagraphStyle(name="CoverSub", fontName="Times-Roman", fontSize=11, textColor=MUTED, leading=15, spaceAfter=6))
    ss.add(ParagraphStyle(name="Cell", fontName="Times-Roman", fontSize=8.5, textColor=INK, leading=11, alignment=TA_LEFT))
    ss.add(ParagraphStyle(name="CellB", fontName="Times-Bold", fontSize=8.5, textColor=NAVY, leading=11, alignment=TA_LEFT))
    ss.add(ParagraphStyle(name="Th", fontName="Times-Bold", fontSize=8.5, textColor=white, leading=11))
    return ss


def _p(ss, text, style="Body"):
    return Paragraph(str(text).replace("\n", "<br/>"), ss[style])


def _c(ss, text, bold=False):
    return Paragraph(str(text), ss["CellB"] if bold else ss["Cell"])


def _header_footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(GOLD)
    canvas.rect(0, h - 6, w, 6, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, w, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.rect(0, 0, 4, 14 * mm, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont("Times-Roman", 8)
    canvas.drawString(16 * mm, 6 * mm, "SafeHer  ·  Karnataka street-safety Excel  ·  feature guide")
    canvas.setFillColor(GOLD)
    canvas.drawRightString(w - 14 * mm, 6 * mm, f"{doc.page}")
    canvas.restoreState()


def _table(ss, headers, rows, widths):
    head = [_p(ss, h, "Th") for h in headers]
    data = [head]
    for row in rows:
        data.append([_c(ss, row[0], True)] + [_c(ss, x) for x in row[1:]])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), white),
                ("BACKGROUND", (0, 1), (-1, -1), PALE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [PALE, white]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("GRID", (0, 0), (-1, -1), 0.3, LINE),
            ]
        )
    )
    return t


def build():
    ss = _styles()
    story = []
    W = [32 * mm, 58 * mm, 88 * mm]

    story.append(_p(ss, "STUDY GUIDE — NOT FOR THE PROJECTOR", "Kicker"))
    story.append(_p(ss, "Karnataka street-safety Excel — every feature explained", "H1"))
    story.append(_p(ss, "File: PBL/Dataset/Karnataka/karnataka_street_safety.xlsx  ·  also by_district/*.xlsx (full streets). Same column meanings in Karnataka_Streetwise Excel (that copy currently has fewer districts until the fresh Overpass run finishes).", "CoverSub"))
    story.append(_p(ss, "SafeHer  ·  Anusha K 1BY25MC017  ·  OSM infrastructure layer for Karnataka (30 districts). This PDF tells you what each column is, what values it takes, and how the safety score is built. Project the PPT only; read this yourself."))

    story.append(_p(ss, "1. What this Excel is", "H1"))
    story.append(_p(ss, "It is a <b>street-wise OpenStreetMap (OSM) infrastructure workbook</b> for the whole of Karnataka. Each row is one public street segment (an OSM way), not a person and not a police FIR. The safety number on the row is a modelled <b>infrastructure proxy</b> (lighting, cameras, police nearby, bus stops, road class, and similar). It is <b>not</b> a crime rate and <b>not</b> a hotspot."))
    story.append(_p(ss, "Statewide totals in this extract (as of 2026-09-14): <b>604,573</b> scored streets · average score <b>4.16 / 10</b> · <b>5,578</b> camera locations · <b>0</b> synthetic street rows · 30 districts."))
    story.append(_p(ss, "What it is not", "H2"))
    story.append(
        ListFlowable(
            [
                ListItem(_p(ss, x, "NoteBullet"), leftIndent=12, bulletColor=NAVY)
                for x in [
                    "Not crime prediction and not a machine-learning model.",
                    "Not live police CCTV, Safe City video, or face recognition. Camera columns are map positions only.",
                    "Not FIR GPS. KSP numbers, when present, are district totals copied onto every street in that district.",
                    "Not Module 1 hotspots. Hotspots come from community GPS reports clustered on a ~1 km grid.",
                ]
            ],
            bulletType="bullet",
            start="•",
            leftIndent=18,
            spaceAfter=6,
        )
    )

    story.append(_p(ss, "2. What is inside the workbook", "H1"))
    story.append(_p(ss, "karnataka_street_safety.xlsx (Karnataka folder)", "H2"))
    story.append(
        _table(
            ss,
            ["Sheet", "Rows", "What it is"],
            [
                ["Street Safety Sample50k", "~50,000 of 604,573", "Sample of street rows with every feature column. This sheet is ~112 MB — avoid opening it in Excel if the file freezes. Use by_district/*.xlsx instead."],
                ["District Summary", "30", "One row per district: counts of Safe / Moderate / Unsafe streets."],
                ["Summary", "few", "Workbook totals: total_streets 604573, districts 30, Safe 19352, plus cameras and average score."],
            ],
            [42 * mm, 38 * mm, 98 * mm],
        )
    )
    story.append(_p(ss, "Full streets (all 604,573 rows, same features) are in <b>by_district/Bagalkote.xlsx</b> … <b>Yadgir.xlsx</b>, sheet name Streets.", "Caption"))
    story.append(_p(ss, "Karnataka_Streetwise Excel (if you have that folder open)", "H2"))
    story.append(_p(ss, "Sheets: Metadata, Factor_Weights, District_Summary, Cameras, Street_Sample. Street columns match the list below except it does <b>not</b> copy KSP crime totals onto streets (score is OSM factors only). Cameras are a separate sheet."))

    story.append(_p(ss, "3. Identity and location features", "H1"))
    story.append(_p(ss, "These say <b>which street</b> and <b>where</b> it is. They are not used as crime coordinates."))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["street_id", "Stable id for this street in this district.", "Text. Pattern KA_{district_code}_{osm_way_id}. Example: KA_556_22838992 (Bagalkote)."],
                ["osm_way_id", "OpenStreetMap identifier of the road geometry.", "Integer. Ground-truth OSM way id. Example: 22838992."],
                ["street_name", "Human-readable name of the way.", "OSM name tag, else ref (highway number), else way/{id}. Can be empty-looking if OSM has no name."],
                ["district_name", "Karnataka district the centroid falls in.", "One of 30 names, e.g. Bengaluru Urban, Mysuru, Kalaburagi, Kodagu. Joined from the district polygon, not typed by hand."],
                ["district_code", "Census / boundary code for that district.", "Integer stored as text/number. Examples: 572 Bengaluru Urban, 576 Kodagu, 556 Bagalkote."],
                ["state", "State of the extract.", "Always the text Karnataka."],
                ["latitude", "North–south position of the street.", "Decimal degrees WGS84. Centroid of the OSM way (middle of the line), not every bend. Karnataka roughly 11.5 to 18.6."],
                ["longitude", "East–west position of the street.", "Decimal degrees WGS84. Karnataka roughly 74.0 to 78.6."],
                ["data_source", "Where the street row came from.", "Usually OpenStreetMap via Overpass. Provenance, not a score."],
                ["as_of", "Date the OSM extract was taken.", "Calendar date (UTC), e.g. 2026-09-14. If OSM changes later, this date tells you how old the snapshot is."],
            ],
            W,
        )
    )

    story.append(_p(ss, "4. Road and lighting tags (OSM, as mapped)", "H1"))
    story.append(_p(ss, "These are copied from OSM tags on the way. Empty means OSM volunteers did not tag it — not that the thing is absent on the ground."))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["highway", "OSM road class. Public streets used in this dataset.", "primary, secondary, tertiary, residential, unclassified, trunk, living_street, pedestrian. service may appear; then service_flagged is true. Most rows are residential."],
                ["surface", "What the road is made of, if tagged.", "Good (score 10): asphalt, concrete, paved, paving_stones. Poor (score 3): unpaved, dirt, gravel, sand, ground, mud. Empty = not tagged; road score is then inferred from highway."],
                ["lit", "Whether OSM says the way is lit.", "yes = tagged as lit (lighting score 10). no = tagged unlit (score 2). Empty / missing = not tagged; lighting is then a proxy from highway + lamp_count_300m."],
                ["service_flagged", "Marks service alleys/driveways if included.", "0 / false = normal public street. 1 / true = highway=service. Statewide extract flags these rather than treating them as main roads."],
            ],
            W,
        )
    )
    story.append(_p(ss, "highway in plain language: trunk/primary = big roads; secondary/tertiary = connecting roads; residential = neighbourhood streets; living_street / pedestrian = people-first ways; unclassified = minor OSM class.", "Caption"))

    story.append(_p(ss, "5. Measured infrastructure around the street", "H1"))
    story.append(_p(ss, "Counted from other OSM points (bus stops, police, hospitals, lamps, cameras) near the street <b>centroid</b>. Distances are metres. These are the synopsis environmental factors: lighting, surveillance, police, transport, road."))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["bus_stop_count", "How many OSM bus stops / stop positions lie within 500 m.", "Integer ≥ 0. 0 = none mapped nearby. Scoring: 0 → 2, 1 → 5, 2 → 7, 3 or more → 10 (factor_bus)."],
                ["police_distance_m", "Metres to the nearest OSM amenity=police.", "Number in metres, or empty if none found in the extract buffer. Closer is “better” for the score: ≤300 m → 10, ≤600 → 8, ≤1000 → 6, ≤2000 → 4, farther → 2."],
                ["hospital_distance_m", "Metres to nearest OSM hospital, clinic or doctors.", "Number in metres, or empty. Scoring: ≤500 → 10, ≤1000 → 8, ≤2000 → 6, ≤3000 → 4, farther → 2."],
                ["lamp_count_300m", "OSM street lamps (highway=street_lamp) within 300 m.", "Integer ≥ 0. Used when lit is missing. More lamps raise the proxy lighting score on bigger roads."],
                ["cctv_within_100m", "Mapped cameras within 100 m.", "Integer ≥ 0. If this (or 250 m count) is > 0, the street is treated as having CCTV for scoring."],
                ["cctv_within_250m", "Mapped cameras within 250 m.", "Integer ≥ 0."],
                ["cctv_within_500m", "Mapped cameras within 500 m.", "Integer ≥ 0. Context density; the yes/no CCTV factor uses nearby presence."],
                ["nearest_camera_m", "Metres to the closest mapped camera.", "Number, or empty if no camera in range of the extract."],
                ["camera_sources", "Which inventory the nearby cameras came from.", "osm and/or official (OpenCity Bengaluru KML). Example: osm or osm,official."],
            ],
            W,
        )
    )
    story.append(_p(ss, "A zero on lamps or cameras means OSM (and optional OpenCity KML) has no node there. Rural districts often have 0 cameras mapped. That is missing map data, not proof that no camera exists on the ground.", "Caption"))

    story.append(_p(ss, "6. The nine-factor safety score", "H1"))
    story.append(_p(ss, "infra_safety_score is a weighted average on a 0–10 scale. Weights always add up to 1.0. If a measured factor is missing (for example no police node at all), its weight is redistributed among the factors that were observed."))
    story.append(
        _table(
            ss,
            ["Factor", "Weight", "What it uses"],
            [
                ["Police", "20%", "police_distance_m → factor_police"],
                ["Hospital", "15%", "hospital_distance_m → factor_hospital"],
                ["Lighting", "15%", "lit, else highway + lamp_count_300m → factor_lighting"],
                ["Bus", "15%", "bus_stop_count → factor_bus"],
                ["Crowd (proxy)", "10%", "inferred from highway → proxy_crowd"],
                ["CCTV", "10%", "camera nearby yes/no → factor_cctv (10 if present, 3 if not)"],
                ["Road", "5%", "surface tag, else highway → factor_road"],
                ["Night (proxy)", "5%", "inferred from highway / crowd → proxy_night"],
                ["Commercial (proxy)", "5%", "inferred from highway → proxy_commercial"],
            ],
            [42 * mm, 28 * mm, 108 * mm],
        )
    )
    story.append(_p(ss, "Score outputs on each street row", "H2"))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["infra_safety_score", "Final infrastructure score.", "Decimal 0–10, typically around 3–6 statewide (average 4.16). Higher = better equipped in OSM terms, not “safer from crime”."],
                ["safety_level", "Band of that score.", "Safe if score ≥ 7. Moderate if score ≥ 4 and &lt; 7. Unsafe if score &lt; 4. Most Karnataka streets fall in Unsafe or Moderate because residential ways without lit/CCTV/police nearby score in the 3–5 range."],
                ["confidence", "How much of the score used actually-observed factors.", "0 to 1. Example 1.0 = all six measured slots (police, hospital, lighting, bus, CCTV, road) had a number. Lower if police/hospital distance was missing."],
                ["factor_police", "Police sub-score.", "10, 8, 6, 4, 2 as in the distance bands above, or empty if no police node."],
                ["factor_hospital", "Hospital sub-score.", "10, 8, 6, 4, 2, or empty."],
                ["factor_lighting", "Lighting sub-score.", "10 if lit=yes; 2 if lit=no; otherwise 4–8 proxy from road class and lamps."],
                ["factor_bus", "Bus sub-score.", "2, 5, 7 or 10 from bus_stop_count."],
                ["factor_cctv", "CCTV sub-score.", "10 if a camera is nearby, else 3. Not empty in the usual extract."],
                ["factor_road", "Road-quality sub-score.", "10 paved, 3 unpaved, or 5–8 proxy from highway if surface is blank."],
            ],
            W,
        )
    )

    story.append(_p(ss, "7. Proxy columns — what “proxy” means", "H1"))
    story.append(_p(ss, "Proxy = stand-in. OSM does not record “how crowded this street feels at 9 pm”. Those three factors are inferred from the road class so the score still has environmental terms from the synopsis (crowd, night, commercial). They are <b>named proxy_</b> so nobody confuses them with a sensor reading."))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["proxy_crowd", "Stand-in for how busy / through-running the road is.", "Always filled. pedestrian 9; trunk/primary 8; secondary 7; tertiary 6; other (residential etc.) 5."],
                ["proxy_night", "Stand-in for night-time activity on that class of road.", "Always filled. trunk/primary 8; secondary 6; if crowd ≥ 7 then 7; else 4."],
                ["proxy_commercial", "Stand-in for commercial-through character.", "Always filled. primary/trunk/secondary 8; tertiary/pedestrian 7; else 4."],
                ["lighting_is_proxy", "Was lighting inferred because lit was empty?", "0 / false = used the lit tag. 1 / true = used highway + lamps. Empty lit is very common."],
                ["road_is_proxy", "Was road score inferred because surface was empty?", "0 / false = used surface. 1 / true = used highway class."],
                ["proxy_flags", "List of which factors were proxies on this row.", "Comma-separated text. Crowd, night, commercial are always listed. lighting and/or road added when those were inferred. Example: crowd,lighting,night,commercial,road."],
            ],
            W,
        )
    )

    story.append(_p(ss, "Worked example of lighting (so the numbers make sense)", "H2"))
    story.append(_p(ss, "If lit is yes → factor_lighting = 10, lighting_is_proxy = false. If lit is no → 2, not a proxy. If lit is empty and highway is residential and lamp_count_300m is 0 → factor_lighting = 4 and lighting_is_proxy = true. If highway is primary and there are more than 2 lamps → 8, still a proxy because OSM did not tag lit=yes."))

    story.append(_p(ss, "8. KSP crime columns (district grain only)", "H1"))
    story.append(_p(ss, "These appear on the Sample50k sheet of the Karnataka-folder workbook. They are <b>not street features</b>. Official Karnataka State Police / SCRB tables are district (or commissionerate) totals. The same numbers are copied onto every street in that district so you can filter “streets in a district that had N sexual-harassment cases last year”. They must never be drawn as a pin on the street."))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["crime_source", "Which official table was joined.", "Text, e.g. OpenCity ← KSP / SCRB. Empty if overlay missing."],
                ["crime_grain", "How fine the crime number is.", "district_or_commissionerate_aggregate. Never street."],
                ["crime_note", "Warning printed on the row.", "Text reminding that this is not a street coordinate."],
                ["ipc_cases_2023", "IPC cases registered in that district, 2023.", "Integer district total. Same on every street of the district."],
                ["sll_cases_2023", "SLL (special/local law) cases, 2023.", "Integer district total."],
                ["total_cases_2023", "IPC + SLL (or published total) 2023.", "Integer district total."],
                ["assault_modesty_incidents_2023", "Assault on women (modesty) count, 2023.", "Integer district total."],
                ["sexual_harassment_total_i_2023", "Sexual harassment cases, 2023.", "Integer district total."],
                ["sexual_harassment_rate_2023", "Published rate for that unit, 2023.", "Number (per the KSP table’s own rate definition, not a street rate)."],
                ["murder_2024", "Murder count in the 2024 IPC district table.", "Integer district total."],
                ["rape_2024", "Rape count, 2024 district table.", "Integer district total."],
                ["robbery_2024", "Robbery count, 2024.", "Integer district total."],
                ["theft_2024", "Theft count, 2024.", "Integer district total."],
            ],
            W,
        )
    )
    story.append(_p(ss, "The pipeline stores crime_used_as_coordinates = false. If ma’am asks whether red dots are FIRs: no. Hotspots are community GPS clusters. KSP is only this overlay.", "Caption"))

    story.append(_p(ss, "9. Camera inventory (separate from the street score)", "H1"))
    story.append(_p(ss, "Street columns count cameras nearby. The camera list itself (parquet / Cameras sheet / cameras.json) is one row per mapped device."))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["camera_id", "Id of this camera record.", "osm_node_{id} or official_opencity_… or osm_node/way id from Overpass."],
                ["osm_id", "OSM node/way id if the camera is from OSM.", "Integer, or empty for some official rows."],
                ["osm_type", "OSM element type.", "Usually node. Sometimes way."],
                ["latitude / longitude", "Where the camera is mapped.", "WGS84 decimal degrees."],
                ["district_name / district_code", "District of the point.", "Same 30-district names/codes."],
                ["source", "Which public inventory.", "osm, osm_overpass, osm_parquet, opencity, official."],
                ["setting", "Indoor vs public outdoor (from OSM tags).", "public_outdoor, indoor, unspecified."],
                ["camera_class", "OSM surveillance type if tagged.", "camera, dome, alpr, traffic, guard, viewpoint, webcam, …"],
                ["operator", "Who OSM says runs it, if tagged.", "Text (e.g. BBMP) or empty."],
                ["as_of", "Extract date.", "Date string."],
            ],
            W,
        )
    )
    story.append(_p(ss, "url / live stream is empty on purpose. God's Eye View can plot these positions on a globe and fall back to Street View / a placeholder. That is not Bengaluru Safe City video.", "Caption"))

    story.append(_p(ss, "10. District Summary sheet", "H1"))
    story.append(
        _table(
            ss,
            ["Column", "Represents", "Values it takes"],
            [
                ["district_name", "District.", "30 Karnataka names."],
                ["Safe / Moderate / Unsafe", "How many streets in that district fall in each safety_level.", "Integers. They add up to that district’s street count. Example Bagalkote: Safe 0, Moderate 2362, Unsafe 8630."],
            ],
            W,
        )
    )
    story.append(_p(ss, "The Streetwise District_Summary sheet also has streets, cameras, avg_infra_safety_score, lit_yes, with_cctv_100m, as_of, crime_used_as_coordinates (always false).", "Caption"))

    story.append(_p(ss, "11. How to read a single street row (example)", "H1"))
    story.append(_p(ss, "Example from Sample50k: street_id KA_556_22838992, name “Bahanpur - Gadankeri Highway”, Bagalkote, highway trunk, surface asphalt, lit empty."))
    story.append(
        ListFlowable(
            [
                ListItem(_p(ss, x, "NoteBullet"), leftIndent=12, bulletColor=NAVY)
                for x in [
                    "It is a real OSM trunk road in Bagalkote. Coordinates are the way centroid.",
                    "surface=asphalt → factor_road = 10, road_is_proxy = false.",
                    "lit empty → lighting is a proxy. Trunk + lamps decide factor_lighting (6 or 8), lighting_is_proxy = true.",
                    "proxy_crowd = 8 and proxy_commercial = 8 because trunk is a major road. proxy_night = 8.",
                    "ipc_cases_2023 etc. on this row are Bagalkote district totals, identical on every Bagalkote street. They do not mean this highway had that many FIRs.",
                    "If infra_safety_score is say 5.1, safety_level is Moderate. That is infrastructure, not “this highway is a crime hotspot”.",
                ]
            ],
            bulletType="bullet",
            start="•",
            leftIndent=18,
            spaceAfter=6,
        )
    )

    story.append(_p(ss, "12. Quick glossary", "H1"))
    story.append(
        _table(
            ss,
            ["Term", "Plain meaning", "Do not confuse with"],
            [
                ["OSM / OpenStreetMap", "Volunteer world map. Streets, police, hospitals, lamps, cameras as mapped.", "Police GIS or Google traffic."],
                ["Overpass", "The API used to download those OSM objects for Karnataka.", "A live camera stream."],
                ["Centroid", "One lat/lon at the middle of the way.", "The full winding geometry of the road."],
                ["Infrastructure proxy", "Score built from mapped amenities and road class.", "Crime rate or hotspot."],
                ["Safe / Moderate / Unsafe", "Bands of infra_safety_score (7 / 4 / below 4).", "SafeHer app Safe/Unsafe feeling reports."],
                ["High / Medium / Low", "Module 1 hotspot risk from report counts. Not in this Excel.", "safety_level on a street row."],
                ["KSP / SCRB", "Official published district crime tables.", "A street FIR pin."],
                ["OpenCity KML", "Public Bengaluru CCTV locations (OSM crowdsourced mirror).", "Live Safe City video."],
                ["God's Eye View", "Open-source globe that can show camera positions.", "Police control-room CCTV."],
                ["as_of", "When we downloaded OSM.", "When an incident happened."],
            ],
            [40 * mm, 72 * mm, 66 * mm],
        )
    )

    story.append(_p(ss, "13. What you can say in viva", "H1"))
    story.append(_p(ss, "“This Excel is the Karnataka OSM street layer. Each row is a real OpenStreetMap way with lighting, CCTV proximity, police and hospital distance, bus-stop count and road class. We turn those into a 0–10 infrastructure score: police 20%, hospital 15%, lighting 15%, bus 15%, crowd 10%, CCTV 10%, road 5%, night 5%, commercial 5%. Crowd, night and commercial are named proxies because OSM does not measure them directly. Safe / Moderate / Unsafe here is that score, not a crime class. KSP columns are district totals, not street coordinates. Hotspots in my module come from community GPS reports, not from this sheet.”"))

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=20 * mm,
        title="Karnataka street-safety Excel — feature guide",
        author="Anusha K",
    )
    doc.build(story, onFirstPage=_header_footer, onLaterPages=_header_footer)
    if COPY.parent.exists():
        shutil.copyfile(OUT, COPY)
    print("Wrote", OUT)
    if COPY.parent.exists():
        print("Copied", COPY)


if __name__ == "__main__":
    build()
