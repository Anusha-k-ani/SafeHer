"""
Generate academic UML / DFD notation diagrams for SafeHer PBL report.
Replaces Napkin AI decorative visuals with standard notation symbols:

  External entity  = square / rectangle
  Process (DFD)    = circle
  Data store       = open rectangle (two parallel lines + right open)
  Actor (UML)      = stick figure
  Use case         = oval
  Activity         = rounded rectangle; decision = diamond; start/end = filled/bullseye
  Sequence         = lifeline boxes + dashed activation lines + message arrows
  Architecture     = layered rectangles
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(r"C:\aman\dataset for pbl\report-visuals")
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1400, 900
BG = (255, 255, 255)
INK = (20, 20, 20)
ACCENT = (45, 45, 45)
LIGHT = (245, 245, 245)
LINE = 2


def font(size: int, bold: bool = False):
    candidates = [
        r"C:\Windows\Fonts\timesbd.ttf" if bold else r"C:\Windows\Fonts\times.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in candidates:
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


F12 = font(14)
F14 = font(16)
F16 = font(18, bold=True)
F18 = font(20, bold=True)
F22 = font(24, bold=True)


def new_canvas(w=W, h=H):
    img = Image.new("RGB", (w, h), BG)
    draw = ImageDraw.Draw(img)
    return img, draw


def text_size(draw, text, f):
    bbox = draw.textbbox((0, 0), text, font=f)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def center_text(draw, xy, text, f, fill=INK):
    tw, th = text_size(draw, text, f)
    draw.text((xy[0] - tw / 2, xy[1] - th / 2), text, font=f, fill=fill)


def wrap_center(draw, cx, cy, text, f, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if text_size(draw, trial, f)[0] <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    line_h = text_size(draw, "Ag", f)[1] + 4
    total = len(lines) * line_h
    y0 = cy - total / 2
    for i, ln in enumerate(lines):
        center_text(draw, (cx, y0 + i * line_h + line_h / 2), ln, f)


def arrow(draw, x1, y1, x2, y2, fill=INK, width=LINE):
    draw.line([(x1, y1), (x2, y2)], fill=fill, width=width)
    # arrow head
    import math
    ang = math.atan2(y2 - y1, x2 - x1)
    size = 10
    for da in (2.6, -2.6):
        ax = x2 - size * math.cos(ang + da)
        ay = y2 - size * math.sin(ang + da)
        draw.line([(x2, y2), (ax, ay)], fill=fill, width=width)


def label_on_line(draw, x1, y1, x2, y2, text, f=F12):
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    tw, th = text_size(draw, text, f)
    pad = 3
    draw.rectangle(
        [mx - tw / 2 - pad, my - th / 2 - pad, mx + tw / 2 + pad, my + th / 2 + pad],
        fill=BG,
    )
    center_text(draw, (mx, my), text, f)


# ---- shapes ----

def draw_entity(draw, x, y, w, h, title):
    """External entity: square/rectangle (DFD / context)."""
    draw.rectangle([x, y, x + w, y + h], outline=INK, width=LINE, fill=LIGHT)
    wrap_center(draw, x + w / 2, y + h / 2, title, F14, w - 16)


def draw_process_circle(draw, cx, cy, r, number, title):
    """DFD process: circle."""
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=INK, width=LINE, fill=BG)
    center_text(draw, (cx, cy - 18), number, F16)
    wrap_center(draw, cx, cy + 14, title, F12, r * 1.6)


def draw_store(draw, x, y, w, h, title):
    """DFD data store: open-ended rectangle (two horizontal lines + left vertical)."""
    draw.line([(x, y), (x + w, y)], fill=INK, width=LINE)
    draw.line([(x, y + h), (x + w, y + h)], fill=INK, width=LINE)
    draw.line([(x, y), (x, y + h)], fill=INK, width=LINE)
    # left double bar common in Yourdon
    draw.line([(x + 8, y), (x + 8, y + h)], fill=INK, width=LINE)
    wrap_center(draw, x + w / 2 + 4, y + h / 2, title, F12, w - 24)


def stick_actor(draw, cx, cy, label):
    """UML stick-figure actor."""
    r = 14
    draw.ellipse([cx - r, cy - 50, cx + r, cy - 50 + 2 * r], outline=INK, width=LINE)
    draw.line([(cx, cy - 50 + 2 * r), (cx, cy - 5)], fill=INK, width=LINE)  # body
    draw.line([(cx - 22, cy - 28), (cx + 22, cy - 28)], fill=INK, width=LINE)  # arms
    draw.line([(cx, cy - 5), (cx - 16, cy + 22)], fill=INK, width=LINE)
    draw.line([(cx, cy - 5), (cx + 16, cy + 22)], fill=INK, width=LINE)
    wrap_center(draw, cx, cy + 40, label, F14, 140)


def use_case_oval(draw, cx, cy, w, h, title):
    draw.ellipse([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2], outline=INK, width=LINE, fill=BG)
    wrap_center(draw, cx, cy, title, F12, w - 20)


def rounded_rect(draw, x, y, w, h, title, fill=BG):
    draw.rounded_rectangle([x, y, x + w, y + h], radius=14, outline=INK, width=LINE, fill=fill)
    wrap_center(draw, x + w / 2, y + h / 2, title, F14, w - 16)


def diamond(draw, cx, cy, w, h, title):
    pts = [(cx, cy - h / 2), (cx + w / 2, cy), (cx, cy + h / 2), (cx - w / 2, cy)]
    draw.polygon(pts, outline=INK, fill=LIGHT)
    # redraw outline thicker
    draw.line(pts + [pts[0]], fill=INK, width=LINE)
    wrap_center(draw, cx, cy, title, F12, w * 0.7)


def start_node(draw, cx, cy):
    draw.ellipse([cx - 10, cy - 10, cx + 10, cy + 10], fill=INK)


def end_node(draw, cx, cy):
    draw.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], outline=INK, width=LINE)
    draw.ellipse([cx - 7, cy - 7, cx + 7, cy + 7], fill=INK)


# ===================== FIGURES =====================

def fig2_1():
    img, d = new_canvas(1400, 820)
    # two system boxes
    d.rectangle([60, 90, 640, 760], outline=INK, width=LINE)
    d.rectangle([760, 90, 1340, 760], outline=INK, width=LINE)
    center_text(d, (350, 120), "Existing System", F22)
    center_text(d, (1050, 120), "Proposed System (SafeHer)", F22)
    # vs
    center_text(d, (700, 420), "VS", F22)

    existing = [
        "Emergency-only mobile apps",
        "Paper / delayed civic complaints",
        "Offline OSM notebooks (no citizen UI)",
        "No anonymous lived-experience map",
        "Closed proprietary safety scores",
    ]
    proposed = [
        "OSM 9-factor street safety baseline",
        "Anonymous safe / unsafe / incident reports",
        "Mobile + Web community map",
        "SOS helplines + live location share",
        "Admin: Generated vs Real monitoring",
    ]
    y = 180
    for t in existing:
        draw_entity(d, 110, y, 480, 70, t)
        y += 100
    y = 180
    for t in proposed:
        draw_entity(d, 810, y, 480, 70, t)
        y += 100
    img.save(OUT / "fig2_1_existing_vs_proposed.png")
    print("saved fig2_1")


def fig4_1():
    img, d = new_canvas(1400, 920)
    layers = [
        ("Presentation Layer", "SafeHer Mobile (Expo)  |  SafeHer Web User Portal (Next.js)"),
        ("Admin Layer", "Web Admin Portal (password session + middleware)"),
        ("Application / API Layer", "Report APIs  ·  Community RPCs  ·  Area matching  ·  SOS deep links"),
        ("Data Layer", "Supabase PostgreSQL + RLS (reports, area_safety, community_summary)"),
        ("Offline Data-Science Layer", "Python Overpass pipeline → scored streets Excel/JSON (~46,424 / 53 BBMP areas)"),
        ("External Services", "OpenStreetMap / Overpass  ·  OSM map tiles  ·  Phone / SMS / WhatsApp"),
    ]
    y = 80
    colors = [(235, 242, 255), (245, 240, 255), (240, 255, 245), (255, 248, 235), (245, 245, 245), (255, 240, 240)]
    for i, ((title, body), fill) in enumerate(zip(layers, colors)):
        d.rounded_rectangle([80, y, 1320, y + 110], radius=8, outline=INK, width=LINE, fill=fill)
        center_text(d, (700, y + 28), f"{i + 1}. {title}", F16)
        wrap_center(d, 700, y + 72, body, F14, 1180)
        if i < len(layers) - 1:
            arrow(d, 700, y + 112, 700, y + 128)
        y += 130
    img.save(OUT / "fig4_1_system_architecture.png")
    print("saved fig4_1")


def fig4_2():
    img, d = new_canvas(1400, 900)
    # central system
    d.rectangle([520, 340, 880, 560], outline=INK, width=3, fill=LIGHT)
    wrap_center(d, 700, 450, "SafeHer System\n(Mobile + Web + Admin\n+ Supabase + OSM Pipeline)", F16, 320)

    entities = [
        (120, 160, "Citizen /\nWoman User"),
        (1080, 160, "Administrator /\nResearcher"),
        (120, 620, "OpenStreetMap /\nOverpass API"),
        (1080, 620, "Police / Helplines\n/ Trusted Contact"),
        (580, 120, "Map Tile\nService"),
        (580, 700, "Device GPS"),
    ]
    for x, y, title in entities:
        draw_entity(d, x, y, 220, 100, title)

    # flows
    flows = [
        (230, 260, 520, 380, "GPS, reports"),
        (520, 400, 230, 260, "map, scores"),
        (1170, 260, 880, 380, "login, queries"),
        (880, 400, 1170, 260, "KPIs, analytics"),
        (230, 620, 520, 520, "OSM features"),
        (880, 520, 1170, 620, "SOS call / SMS"),
        (690, 220, 700, 340, "tiles"),
        (700, 560, 690, 700, "location fix"),
    ]
    # draw one-way arrows carefully
    arrow(d, 340, 250, 520, 380)
    label_on_line(d, 340, 250, 520, 380, "report + GPS")
    arrow(d, 520, 420, 340, 250)
    # simplify: fewer bidirectional
    arrow(d, 1060, 250, 880, 380)
    label_on_line(d, 1060, 250, 880, 380, "admin requests")
    arrow(d, 880, 420, 1060, 250)
    label_on_line(d, 880, 420, 1060, 250, "dashboards")
    arrow(d, 340, 620, 520, 520)
    label_on_line(d, 340, 620, 520, 520, "street/POI data")
    arrow(d, 880, 520, 1060, 620)
    label_on_line(d, 880, 520, 1060, 620, "call / location share")
    arrow(d, 690, 220, 700, 340)
    label_on_line(d, 690, 220, 700, 340, "map tiles")
    arrow(d, 700, 700, 700, 560)
    label_on_line(d, 700, 700, 700, 560, "coordinates")

    # legend
    d.rectangle([40, 820, 1360, 880], outline=INK, width=1)
    wrap_center(
        d, 700, 850,
        "Notation: Rectangle = External Entity   |   Thick rectangle = System boundary   |   Arrow = Data / control flow",
        F12, 1280,
    )
    img.save(OUT / "fig4_2_context_diagram.png")
    print("saved fig4_2")


def fig5_1():
    img, d = new_canvas(1400, 900)

    # entities
    draw_entity(d, 40, 200, 180, 90, "Citizen")
    draw_entity(d, 40, 420, 180, 90, "Administrator")
    draw_entity(d, 40, 640, 180, 90, "OSM / Overpass")
    draw_entity(d, 1180, 320, 180, 90, "Police /\nHelplines")

    # central process
    draw_process_circle(d, 700, 420, 130, "0", "SafeHer\nPlatform")

    # data stores
    draw_store(d, 520, 700, 360, 70, "D1 Reports / Area Safety")
    draw_store(d, 980, 700, 280, 70, "D2 OSM Street Scores")

    arrow(d, 220, 245, 580, 360)
    label_on_line(d, 220, 245, 580, 360, "location, report")
    arrow(d, 620, 360, 220, 245)
    label_on_line(d, 620, 360, 220, 245, "map, summary")

    arrow(d, 220, 465, 570, 420)
    label_on_line(d, 220, 465, 570, 420, "credentials, queries")
    arrow(d, 620, 450, 220, 480)
    label_on_line(d, 620, 450, 220, 480, "KPIs, analytics")

    arrow(d, 220, 680, 600, 520)
    label_on_line(d, 220, 680, 600, 520, "highway, POI data")

    arrow(d, 700, 550, 700, 700)
    label_on_line(d, 700, 550, 700, 700, "store / read reports")
    arrow(d, 800, 520, 1100, 700)
    label_on_line(d, 800, 520, 1100, 700, "scored streets")

    arrow(d, 820, 400, 1180, 365)
    label_on_line(d, 820, 400, 1180, 365, "SOS call / SMS")

    d.rectangle([40, 820, 1360, 880], outline=INK, width=1)
    wrap_center(
        d, 700, 850,
        "Notation: Square = External Entity   |   Circle = Process   |   Open rectangle = Data Store   |   Arrow = Data flow",
        F12, 1280,
    )
    img.save(OUT / "fig5_1_dfd_level0.png")
    print("saved fig5_1")


def fig5_2():
    img, d = new_canvas(1500, 1000)

    draw_entity(d, 40, 120, 160, 80, "Citizen")
    draw_entity(d, 40, 780, 160, 80, "Admin")
    draw_entity(d, 1300, 120, 160, 80, "OSM")
    draw_entity(d, 1300, 780, 160, 80, "Police /\nHelpline")

    procs = [
        (400, 180, "1.0", "Match Area"),
        (750, 180, "2.0", "Validate &\nStore Report"),
        (1100, 180, "3.0", "Score OSM\nStreets"),
        (400, 480, "4.0", "Aggregate\nCommunity"),
        (750, 480, "5.0", "Render Map\n& Summary"),
        (1100, 480, "6.0", "Admin Auth\n& Analytics"),
        (750, 760, "7.0", "SOS Assist"),
    ]
    for cx, cy, num, title in procs:
        draw_process_circle(d, cx, cy, 85, num, title)

    draw_store(d, 300, 320, 280, 55, "D1 Reports")
    draw_store(d, 980, 320, 280, 55, "D2 Street Scores")
    draw_store(d, 300, 620, 280, 55, "D3 Trusted Contact\n(on device)")

    arrow(d, 200, 160, 320, 160)
    label_on_line(d, 200, 160, 320, 160, "GPS")
    arrow(d, 485, 180, 665, 180)
    label_on_line(d, 485, 180, 665, 180, "area name")
    arrow(d, 750, 265, 750, 320)
    # to D1 from 2.0
    arrow(d, 750, 265, 440, 320)
    label_on_line(d, 750, 265, 440, 320, "report row")
    arrow(d, 1300, 160, 1180, 160)
    label_on_line(d, 1300, 160, 1180, 160, "POI/highways")
    arrow(d, 1100, 265, 1120, 320)
    label_on_line(d, 1100, 265, 1120, 320, "scores")
    arrow(d, 440, 375, 400, 395)
    arrow(d, 400, 395, 400, 395)
    arrow(d, 440, 375, 360, 480)
    # D1 to 4.0
    arrow(d, 440, 375, 400, 395)
    arrow(d, 360, 347, 360, 400)
    arrow(d, 360, 400, 360, 400)
    arrow(d, 440, 347, 400, 400)
    # clearer links
    arrow(d, 420, 375, 400, 400)
    arrow(d, 400, 400, 400, 400)

    # Redraw key flows cleanly with fewer overlaps
    img, d = new_canvas(1500, 1050)
    draw_entity(d, 40, 80, 150, 70, "Citizen")
    draw_entity(d, 40, 900, 150, 70, "Admin")
    draw_entity(d, 1310, 80, 150, 70, "OSM")
    draw_entity(d, 1310, 900, 150, 70, "Police")

    draw_process_circle(d, 380, 200, 80, "1.0", "Match\nArea")
    draw_process_circle(d, 750, 200, 80, "2.0", "Store\nReport")
    draw_process_circle(d, 1120, 200, 80, "3.0", "Score\nOSM")
    draw_process_circle(d, 380, 520, 80, "4.0", "Aggregate")
    draw_process_circle(d, 750, 520, 80, "5.0", "Map &\nSummary")
    draw_process_circle(d, 1120, 520, 80, "6.0", "Admin\nAnalytics")
    draw_process_circle(d, 750, 820, 80, "7.0", "SOS\nAssist")

    draw_store(d, 250, 340, 260, 50, "D1 Reports")
    draw_store(d, 1000, 340, 260, 50, "D2 Street Scores")
    draw_store(d, 250, 680, 260, 50, "D3 Device Contact")

    arrow(d, 190, 115, 300, 180)
    label_on_line(d, 190, 115, 300, 180, "GPS + choices")
    arrow(d, 460, 200, 670, 200)
    label_on_line(d, 460, 200, 670, 200, "area label")
    arrow(d, 750, 280, 400, 340)
    label_on_line(d, 750, 280, 400, 340, "insert")
    arrow(d, 1310, 115, 1200, 180)
    label_on_line(d, 1310, 115, 1200, 180, "features")
    arrow(d, 1120, 280, 1130, 340)
    label_on_line(d, 1120, 280, 1130, 340, "scores")
    arrow(d, 380, 390, 380, 440)
    label_on_line(d, 380, 390, 380, 440, "reports")
    arrow(d, 460, 520, 670, 520)
    label_on_line(d, 460, 520, 670, 520, "aggregates")
    arrow(d, 1120, 390, 830, 480)
    label_on_line(d, 1120, 390, 830, 480, "baseline")
    arrow(d, 190, 930, 1040, 560)
    label_on_line(d, 400, 780, 900, 620, "login/query")
    arrow(d, 1040, 560, 1120, 560)
    arrow(d, 190, 115, 670, 760)
    label_on_line(d, 280, 500, 500, 700, "SOS action")
    arrow(d, 830, 820, 1310, 930)
    label_on_line(d, 830, 820, 1310, 930, "call/SMS")
    arrow(d, 670, 820, 510, 705)
    label_on_line(d, 670, 820, 510, 705, "trusted #")
    arrow(d, 750, 440, 750, 280)
    # feedback map to citizen
    arrow(d, 670, 520, 190, 140)
    label_on_line(d, 400, 300, 300, 200, "map pins")

    d.rectangle([40, 990, 1460, 1035], outline=INK, width=1)
    wrap_center(
        d, 750, 1012,
        "Notation: Square = Entity  |  Circle = Process  |  Open rectangle = Data Store  |  Arrow = Data flow",
        F12, 1380,
    )
    img.save(OUT / "fig5_2_dfd_level1.png")
    print("saved fig5_2")


def fig5_3():
    img, d = new_canvas(1500, 1000)

    # system boundary
    d.rectangle([300, 70, 1200, 920], outline=INK, width=2)
    center_text(d, (750, 95), "SafeHer", F18)

    stick_actor(d, 120, 280, "Citizen")
    stick_actor(d, 120, 720, "Administrator")
    stick_actor(d, 1380, 520, "Police /\nTrusted Contact")

    citizen_cases = [
        (520, 170, "Confirm Location"),
        (520, 270, "Submit Feeling Report"),
        (520, 370, "Submit Incident Report"),
        (520, 470, "Browse Safety Map"),
        (520, 570, "Call Helpline"),
        (520, 670, "Share Live Location"),
        (520, 770, "Save Trusted Contact"),
    ]
    admin_cases = [
        (980, 220, "Login to Admin"),
        (980, 340, "View OSM Dashboard"),
        (980, 460, "View Community Analytics"),
        (980, 580, "Search Streets / Areas"),
        (980, 700, "Read Methodology"),
    ]
    for cx, cy, t in citizen_cases + admin_cases:
        use_case_oval(d, cx, cy, 260, 70, t)

    # Citizen associations (left edge of ovals at cx-130)
    for _, cy, _ in citizen_cases:
        d.line([(170, 260), (390, cy)], fill=INK, width=1)

    # Admin associations
    for _, cy, _ in admin_cases:
        d.line([(170, 700), (850, cy)], fill=INK, width=1)

    # Police / trusted contact linked to SOS-related use cases
    d.line([(1300, 500), (650, 570)], fill=INK, width=1)
    d.line([(1300, 500), (650, 670)], fill=INK, width=1)

    wrap_center(
        d, 750, 960,
        "Notation: Stick figure = Actor   |   Oval = Use Case   |   Rectangle = System boundary   |   Line = Association",
        F12, 1300,
    )
    img.save(OUT / "fig5_3_use_case.png")
    print("saved fig5_3")


def fig5_4():
    img, d = new_canvas(1100, 1400)
    start_node(d, 550, 80)
    arrow(d, 550, 90, 550, 120)

    steps = [
        (480, 120, 140, 55, "Open SOS tab"),
        (480, 210, 140, 55, "Refresh GPS\n(optional)"),
        (480, 300, 140, 55, "Resolve BBMP\narea name"),
    ]
    y = 120
    for title in ["Open SOS tab", "Request / refresh GPS", "Resolve BBMP area"]:
        rounded_rect(d, 400, y, 300, 60, title)
        arrow(d, 550, y + 60, 550, y + 85)
        y += 95

    diamond(d, 550, y + 50, 280, 100, "Choose action?")
    # branches
    arrow(d, 410, y + 50, 200, y + 50)
    center_text(d, (300, y + 30), "Call 112", F12)
    arrow(d, 690, y + 50, 900, y + 50)
    center_text(d, (800, y + 30), "SMS Police", F12)
    arrow(d, 550, y + 100, 550, y + 140)
    center_text(d, (620, y + 120), "Helpline card", F12)

    rounded_rect(d, 50, y + 140, 220, 70, "Open dialer\n(112 / 100 / 1091)")
    rounded_rect(d, 780, y + 140, 220, 70, "Open Messages /\nWhatsApp share")
    rounded_rect(d, 400, y + 140, 300, 70, "Call selected\nhelpline")

    # merge
    my = y + 260
    arrow(d, 160, y + 210, 160, my)
    arrow(d, 890, y + 210, 890, my)
    arrow(d, 550, y + 210, 550, my)
    d.line([(160, my), (890, my)], fill=INK, width=LINE)
    arrow(d, 550, my, 550, my + 30)

    rounded_rect(d, 375, my + 30, 350, 60, "Attach Maps pin +\ncoordinates + area")
    arrow(d, 550, my + 90, 550, my + 120)
    diamond(d, 550, my + 180, 260, 100, "SMS trusted\ncontact?")
    arrow(d, 680, my + 180, 900, my + 180)
    center_text(d, (790, my + 160), "Yes", F12)
    rounded_rect(d, 820, my + 220, 220, 60, "Send SMS to\nsaved contact")
    arrow(d, 930, my + 280, 930, my + 330)
    arrow(d, 550, my + 230, 550, my + 330)
    center_text(d, (500, my + 270), "No", F12)
    d.line([(550, my + 330), (930, my + 330)], fill=INK, width=LINE)
    arrow(d, 550, my + 330, 550, my + 360)
    rounded_rect(d, 400, my + 360, 300, 55, "End SOS workflow")
    arrow(d, 550, my + 415, 550, my + 445)
    end_node(d, 550, my + 460)

    wrap_center(
        d, 550, 1360,
        "Notation: ● Start   |   ◉ End   |   Rounded rectangle = Action   |   Diamond = Decision",
        F12, 1000,
    )
    img.save(OUT / "fig5_4_sos_activity.png")
    print("saved fig5_4")


def fig5_5():
    img, d = new_canvas(1500, 900)

    actors = [
        (180, "Citizen\n(UI)"),
        (480, "Area\nMatcher"),
        (780, "Supabase\nClient"),
        (1080, "RLS /\nDatabase"),
        (1360, "Community\nSummary"),
    ]
    top = 100
    bottom = 820
    for x, name in actors:
        d.rectangle([x - 70, top, x + 70, top + 70], outline=INK, width=LINE, fill=LIGHT)
        wrap_center(d, x, top + 35, name, F12, 130)
        # lifeline
        for y in range(top + 70, bottom, 12):
            d.line([(x, y), (x, min(y + 6, bottom))], fill=(120, 120, 120), width=1)

    messages = [
        (180, 480, 200, "1: capture GPS + choices", False),
        (480, 180, 250, "2: area name", True),
        (180, 780, 320, "3: insert(report)", False),
        (780, 1080, 370, "4: check rate limit + RLS", False),
        (1080, 780, 430, "5: ok / reject", True),
        (780, 180, 490, "6: success", True),
        (180, 1360, 560, "7: refresh summary (opt.)", False),
        (1360, 180, 630, "8: counts / area verdict", True),
        (180, 180, 720, "9: show Thank You screen", False),
    ]
    for x1, x2, y, text, dashed in messages:
        if x1 == x2:
            # self message
            d.arc([x1, y - 20, x1 + 60, y + 20], 270, 90, fill=INK, width=LINE)
            arrow(d, x1 + 60, y, x1 + 2, y)
        else:
            if dashed:
                # dashed line
                x = x1
                step = 8 if x2 > x1 else -8
                while (step > 0 and x < x2 - 12) or (step < 0 and x > x2 + 12):
                    d.line([(x, y), (x + step / 2, y)], fill=INK, width=LINE)
                    x += step
                arrow(d, x2 - (10 if x2 > x1 else -10), y, x2, y)
            else:
                arrow(d, x1, y, x2, y)
        # activation thin bar on target
        tx = x2
        d.rectangle([tx - 4, y - 8, tx + 4, y + 28], outline=INK, fill=(220, 220, 220))
        # label
        mx = (x1 + x2) / 2
        tw, th = text_size(d, text, F12)
        d.rectangle([mx - tw / 2 - 2, y - th - 6, mx + tw / 2 + 2, y - 2], fill=BG)
        center_text(d, (mx, y - th / 2 - 4), text, F12)

    wrap_center(
        d, 750, 870,
        "Notation: Object/lifeline header = Rectangle   |   Solid arrow = Call message   |   Dashed arrow = Return   |   Thin bar = Activation",
        F12, 1400,
    )
    img.save(OUT / "fig5_5_sequence_report.png")
    print("saved fig5_5")


def main():
    fig2_1()
    fig4_1()
    fig4_2()
    fig5_1()
    fig5_2()
    fig5_3()
    fig5_4()
    fig5_5()
    print("All notation diagrams written to", OUT)


if __name__ == "__main__":
    main()
