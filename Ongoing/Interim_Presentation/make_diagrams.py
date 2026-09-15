#!/usr/bin/env python3
"""Separate, non-overlapping flowcharts for the interim deck.

Each box: data-science term on line 1, everyday wording on line 2.
Boxes never share pixels; arrows live only in the gaps.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"

NAVY = (12, 35, 64)
NAVY2 = (22, 58, 95)
GOLD = (196, 163, 90)
INK = (27, 36, 48)
MUTED = (90, 101, 112)
WHITE = (255, 255, 255)
BG = (247, 249, 252)
HIGH = (139, 30, 63)
MED = (180, 83, 9)
OK = (31, 107, 74)
LINE = (210, 216, 222)

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def f(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT, size)


def rounded(draw, box, r, fill, outline=None, width=3):
    draw.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for word in words:
        trial = (cur + " " + word).strip()
        if draw.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def h_arrow(d, x0, x1, y, color=GOLD):
    """Arrow entirely inside (x0, x1)."""
    d.line((x0, y, x1 - 22, y), fill=color, width=6)
    d.polygon([(x1 - 24, y - 12), (x1, y), (x1 - 24, y + 12)], fill=color)


def v_arrow(d, x, y0, y1, color=GOLD):
    d.line((x, y0, x, y1 - 22), fill=color, width=6)
    d.polygon([(x - 12, y1 - 24), (x, y1), (x + 12, y1 - 24)], fill=color)


def box(d, x, y, w, h, num, ds, plain, accent=NAVY):
    rounded(d, (x, y, x + w, y + h), 22, WHITE, accent, 3)
    d.rectangle((x + 3, y + 3, x + w - 3, y + 12), fill=GOLD)
    badge = 54
    d.ellipse((x + 22, y + 28, x + 22 + badge, y + 28 + badge), fill=GOLD)
    nb = f(20, True)
    tw = d.textlength(num, font=nb)
    d.text((x + 22 + (badge - tw) / 2, y + 42), num, font=nb, fill=NAVY)
    title_x = x + 90
    title_w = w - 110
    y_t = y + 32
    for line in wrap(d, ds, f(22, True), title_w)[:2]:
        d.text((title_x, y_t), line, font=f(22, True), fill=NAVY)
        y_t += 30
    y_p = y + 108
    d.text((x + 24, y_p), "In plain words", font=f(13, True), fill=GOLD)
    y_p += 28
    for line in wrap(d, plain, f(18), w - 48)[:4]:
        d.text((x + 24, y_p), line, font=f(18), fill=MUTED)
        y_p += 26


def caption(d, text, w):
    d.text((64, 36), "DATA SCIENCE  ·  EVERYDAY MEANING", font=f(16, True), fill=GOLD)
    d.text((64, 72), text, font=f(28, True), fill=NAVY)


def flow_end_to_end():
    w, h = 2400, 980
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    caption(d, "How one report becomes a place on the officer’s map", w)
    steps = [
        ("01", "Data capture", "A person taps Report. The phone sends the place and time."),
        ("02", "Operational store", "The report is saved in a secure table. Only approved rows are public."),
        ("03", "Analytical pipeline", "The computer cleans the list, groups nearby reports, and scores risk."),
        ("04", "Feature store (JSON)", "Results are saved as files the dashboard already knows how to read."),
        ("05", "Decision support UI", "An officer opens a map, filters, and a short patrol list. No one emails a sheet."),
    ]
    bw, bh, gap = 390, 520, 58
    total = 5 * bw + 4 * gap
    x0 = (w - total) // 2
    y0 = 170
    for i, (n, ds, plain) in enumerate(steps):
        x = x0 + i * (bw + gap)
        box(d, x, y0, bw, bh, n, ds, plain)
        if i < 4:
            h_arrow(d, x + bw + 6, x + bw + gap - 6, y0 + bh // 2)
    im.save(ASSETS / "safeher-pipeline.png", "PNG", optimize=True)


def flow_two_paths():
    w, h = 2400, 1080
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    caption(d, "Two independent paths — they do not wait on each other", w)
    d.text((64, 118), "Each lane is a separate flowchart. Nothing is merged.", font=f(18), fill=MUTED)

    lanes = [
        (
            70,
            OK,
            "Path A  ·  streaming KPIs",
            "Seconds after submit  ·  what arrived today",
            [
                ("Write event", "The app inserts one row."),
                ("Row-level security", "Only approved rows can be read."),
                ("Live aggregation", "Counts and the map refresh by themselves."),
            ],
        ),
        (
            1240,
            NAVY,
            "Path B  ·  batch analytics",
            "Hotspots and patrol alerts  ·  Module 1 pipeline",
            [
                ("Extract–transform", "Approved reports + OSM context are loaded."),
                ("Spatial clustering", "Nearby reports are grouped on a 1 km grid."),
                ("Publish artefacts", "JSON / CSV / map files update the dashboard."),
            ],
        ),
    ]
    for x0, accent, title, sub, steps in lanes:
        rounded(d, (x0, 170, x0 + 1090, 1020), 24, WHITE, accent, 3)
        d.rectangle((x0, 170, x0 + 1090, 270), fill=accent)
        d.text((x0 + 36, 192), title, font=f(26, True), fill=WHITE)
        d.text((x0 + 36, 232), sub, font=f(16), fill=(230, 230, 230))
        bw, bh = 980, 190
        for i, (ds, plain) in enumerate(steps):
            y = 300 + i * 230
            box(d, x0 + 55, y, bw, bh, f"{i+1:02d}", ds, plain, accent)
            if i < 2:
                v_arrow(d, x0 + 545, y + bh + 4, y + 230 - 4, accent)
    im.save(ASSETS / "safeher-two-paths.png", "PNG", optimize=True)


def flow_module1():
    w, h = 2400, 1120
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    caption(d, "Module 1 pipeline — eight recorded stages, left to right, then down", w)
    d.text((64, 118), "This is an ETL + geospatial workflow. It describes the past. It does not predict the future.", font=f(18), fill=MUTED)

    row1 = [
        ("01", "Data integration", "Bring map data and reports together into one table."),
        ("02", "Pre-processing", "Remove duplicates, bad GPS, and anything outside Karnataka."),
        ("03", "Incident analysis", "Keep “something happened” rows. Count type, time, and place."),
        ("04", "Geospatial binning", "Drop each report into a ~1 km square on the map."),
    ]
    row2 = [
        ("05", "Hotspot detection", "A square with 3 or more reports is a hotspot."),
        ("06", "Risk stratification", "Colour it High, Medium or Low using published rules."),
        ("07", "Alert generation", "High or recently active squares become the patrol list."),
        ("08", "Serving layer", "Save JSON, CSV and a map. The dashboard reads them."),
    ]
    bw, bh, gap = 520, 340, 56
    x0 = 64
    y1, y2 = 170, 640
    for i, (n, ds, plain) in enumerate(row1):
        x = x0 + i * (bw + gap)
        box(d, x, y1, bw, bh, n, ds, plain)
        if i < 3:
            h_arrow(d, x + bw + 6, x + bw + gap - 6, y1 + bh // 2)
    # down from last of row 1 to first of row 2
    x_last = x0 + 3 * (bw + gap) + bw // 2
    v_arrow(d, x_last, y1 + bh + 6, y2 - 6)
    for i, (n, ds, plain) in enumerate(row2):
        x = x0 + i * (bw + gap)
        box(d, x, y2, bw, bh, n, ds, plain)
        if i < 3:
            h_arrow(d, x + bw + 6, x + bw + gap - 6, y2 + bh // 2)
    im.save(ASSETS / "safeher-module1-flow.png", "PNG", optimize=True)


def flow_hotspot():
    w, h = 2400, 1020
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    caption(d, "How a hotspot is identified  ·  spatial density, not a forecast", w)
    d.text((64, 118), "Think of the map as graph paper. We count reports in each square. Many in one square = a hotspot.", font=f(18), fill=MUTED)

    # four equal panels with a gap between each
    panels = [
        ("01  Raw observations", "Each pin is one report with GPS."),
        ("02  Spatial binning", "Pins snap to a 0.01° cell (~1 km)."),
        ("03  Support threshold", "Keep cells with at least 3 reports."),
        ("04  Recurrence", "Reports on 2+ different days = repeating."),
    ]
    pw, ph, gap = 520, 720, 48
    x0 = 64
    y0 = 170
    for i, (title, body) in enumerate(panels):
        x = x0 + i * (pw + gap)
        rounded(d, (x, y0, x + pw, y0 + ph), 22, WHITE, NAVY, 3)
        d.rectangle((x, y0, x + pw, y0 + 70), fill=NAVY)
        d.text((x + 22, y0 + 22), title, font=f(20, True), fill=WHITE)
        d.text((x + 22, y0 + 640), body, font=f(17), fill=MUTED)

        cx, cy = x + pw // 2, y0 + 340
        if i == 0:
            for dx, dy, col in [(-70, -40, HIGH), (40, 50, MED), (-20, 90, NAVY), (80, -80, OK), (10, -10, HIGH)]:
                d.ellipse((cx + dx - 14, cy + dy - 14, cx + dx + 14, cy + dy + 14), fill=col)
        elif i == 1:
            for gx in range(-2, 3):
                for gy in range(-2, 3):
                    sx, sy = cx + gx * 70 - 28, cy + gy * 70 - 28
                    d.rectangle((sx, sy, sx + 56, sy + 56), outline=LINE, width=2)
            d.rectangle((cx - 28, cy - 28, cx + 28, cy + 28), outline=GOLD, width=5)
            d.ellipse((cx - 10, cy - 10, cx + 10, cy + 10), fill=HIGH)
        elif i == 2:
            d.rectangle((cx - 90, cy - 90, cx + 90, cy + 90), outline=HIGH, width=6)
            d.text((cx - 70, cy - 16), "count ≥ 3", font=f(22, True), fill=HIGH)
            d.text((cx - 88, cy + 24), "HOTSPOT", font=f(20, True), fill=NAVY)
        else:
            d.text((cx - 110, cy - 50), "Day 1  ·  Day 12  ·  Day 40", font=f(16, True), fill=NAVY)
            d.text((cx - 100, cy + 10), "Same square, many days", font=f(16), fill=MUTED)
            d.text((cx - 70, cy + 55), "→  recurring area", font=f(18, True), fill=GOLD)

        if i < 3:
            h_arrow(d, x + pw + 6, x + pw + gap - 6, y0 + ph // 2)
    im.save(ASSETS / "safeher-hotspot-method.png", "PNG", optimize=True)


def flow_risk():
    w, h = 2400, 1000
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    caption(d, "Risk stratification — rule-based, auditable, not a machine-learning black box", w)
    d.text((64, 118), "We do not train a predictor. We apply three if–then rules an officer can read aloud in a briefing.", font=f(18), fill=MUTED)

    # left: input, then three stacked outcomes with conditions
    box(d, 80, 200, 620, 680, "IN", "Hotspot cell", "A 1 km square that already has 3 or more incident reports.", NAVY)
    h_arrow(d, 710, 820, 540)

    rules = [
        ("High", "If count ≥ 8, or count ≥ 5 and harassment share ≥ 40%.", "Look here first.", HIGH),
        ("Medium", "Else if count ≥ 4 (and not High).", "Watch this square.", MED),
        ("Low", "Else the cell is still a hotspot, but quieter.", "Note it; lower priority.", NAVY2),
    ]
    for i, (lab, ds, plain, col) in enumerate(rules):
        y = 180 + i * 250
        rounded(d, (840, y, 2320, y + 220), 22, WHITE, col, 4)
        rounded(d, (870, y + 55, 1120, y + 155), 14, col)
        d.text((895, y + 88), lab, font=f(26, True), fill=WHITE)
        d.text((1160, y + 40), ds, font=f(22, True), fill=NAVY)
        d.text((1160, y + 90), "In plain words", font=f(14, True), fill=GOLD)
        d.text((1160, y + 120), plain, font=f(20), fill=MUTED)
    im.save(ASSETS / "safeher-risk-flow.png", "PNG", optimize=True)


def security():
    w, h = 2400, 1180
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    caption(d, "Information security — two separate surfaces, never mixed", w)
    cols = [
        (
            "Public reporting  ·  privacy by design",
            [
                ("Anonymous submit", "Name, phone and photo are not asked."),
                ("Rate limit", "One device: at most five reports per hour."),
                ("GPS for placement only", "We store where it happened, not a tracking trail."),
                ("Row Level Security", "The public may read only approved rows."),
            ],
        ),
        (
            "Authority dashboard  ·  access control",
            [
                ("Authenticated session", "Password is checked on the server."),
                ("HttpOnly cookie", "Secure, SameSite=Lax, seven-day expiry."),
                ("Route guard", "Every /admin page except login needs a session."),
                ("No reporter identity", "Officers see places and counts, not people."),
            ],
        ),
    ]
    for ci, (title, items) in enumerate(cols):
        x = 64 + ci * 1170
        rounded(d, (x, 170, x + 1100, 1120), 24, WHITE, NAVY, 3)
        d.rectangle((x, 170, x + 1100, 260), fill=NAVY)
        d.text((x + 36, 200), title, font=f(24, True), fill=WHITE)
        for i, (head, body) in enumerate(items):
            y = 300 + i * 190
            box(d, x + 40, y, 1020, 170, f"{i+1:02d}", head, body)
    im.save(ASSETS / "safeher-security.png", "PNG", optimize=True)


if __name__ == "__main__":
    ASSETS.mkdir(exist_ok=True)
    flow_end_to_end()
    flow_two_paths()
    flow_module1()
    flow_hotspot()
    flow_risk()
    security()
    print("Wrote flowcharts into", ASSETS)
