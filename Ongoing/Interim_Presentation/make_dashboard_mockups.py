#!/usr/bin/env python3
"""Bengaluru authority-dashboard mockups for the interim deck."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"

PURPLE = (124, 58, 237)
PURPLE_SOFT = (245, 243, 255)
NAVY = (17, 24, 39)
INK = (17, 24, 39)
MUTED = (107, 114, 128)
LINE = (229, 231, 235)
WHITE = (255, 255, 255)
BG = (249, 250, 251)
HIGH = (224, 36, 36)
MED = (217, 119, 6)
LOW = (26, 86, 219)
GREEN = (14, 159, 110)
CHROME = (243, 244, 246)

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def f(size, bold=False):
    return ImageFont.truetype(FONT_B if bold else FONT, size)


def rr(d, box, r, fill, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def chrome(im, title, url):
    d = ImageDraw.Draw(im)
    w, _ = im.size
    d.rectangle((0, 0, w, 52), fill=CHROME)
    for i, col in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        d.ellipse((16 + i * 22, 16, 32 + i * 22, 32), fill=col)
    rr(d, (110, 12, w - 24, 40), 8, WHITE, LINE)
    d.text((124, 18), url, font=f(14), fill=MUTED)
    d.text((w - 220, 16), title, font=f(13, True), fill=NAVY)


def nav(d, w, active):
    d.rectangle((0, 52, w, 118), fill=WHITE)
    d.line((0, 118, w, 118), fill=LINE, width=1)
    d.rounded_rectangle((24, 66, 60, 102), 8, fill=NAVY)
    d.text((32, 74), "AD", font=f(14, True), fill=WHITE)
    d.text((72, 68), "SafeHer Admin", font=f(16, True), fill=NAVY)
    d.text((72, 90), "Bengaluru  ·  53 BBMP areas", font=f(12), fill=MUTED)
    items = ["Dashboard", "Hotspots", "Analytics", "Map", "Areas"]
    x = 430
    for name in items:
        on = name == active
        if on:
            rr(d, (x - 10, 70, x + 8 + 14 * len(name), 104), 8, PURPLE_SOFT)
            d.text((x, 78), name, font=f(14, True), fill=PURPLE)
        else:
            d.text((x, 78), name, font=f(14), fill=MUTED)
        x += 14 * len(name) + 36
    rr(d, (w - 130, 72, w - 28, 104), 8, WHITE, LINE)
    d.text((w - 112, 80), "Sign out", font=f(13), fill=MUTED)


def kpi(d, x, y, w, h, label, value, sub, accent):
    rr(d, (x, y, x + w, y + h), 16, WHITE, LINE)
    d.ellipse((x + 22, y + 22, x + 54, y + 54), fill=accent)
    d.text((x + 70, y + 22), label, font=f(13), fill=MUTED)
    d.text((x + 70, y + 44), value, font=f(28, True), fill=NAVY)
    d.text((x + 70, y + 86), sub, font=f(13), fill=MUTED)


def pill(d, x, y, text, fill):
    tw = 14 * len(text) + 8
    rr(d, (x, y, x + tw, y + 26), 13, fill)
    d.text((x + 10, y + 5), text, font=f(12, True), fill=WHITE)
    return tw


def field(d, x, y, w, label, value):
    d.text((x, y), label, font=f(12, True), fill=MUTED)
    rr(d, (x, y + 22, x + w, y + 62), 10, WHITE, LINE)
    d.text((x + 12, y + 34), value, font=f(14), fill=NAVY)
    d.polygon([(x + w - 22, y + 38), (x + w - 12, y + 38), (x + w - 17, y + 46)], fill=MUTED)


def overview():
    w, h = 2400, 1350
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    chrome(im, "Officer session", "https://admin.safeher.local/admin/dashboard")
    nav(d, w, "Dashboard")
    d.text((40, 145), "Street safety overview", font=f(32, True), fill=NAVY)
    d.text((40, 190), "OSM infrastructure plus Module 1 hotspots  ·  officer self-serve  ·  no file request required", font=f(16), fill=MUTED)
    cards = [
        (40, "46,424", "Streets scored", "53 BBMP areas", GREEN),
        (620, "5.78", "Avg safety score / 10", "Nine-factor OSM model", (26, 86, 219)),
        (1200, "26", "Incident hotspots", "~1 km clusters from reports", HIGH),
        (1780, "21", "Patrol alerts", "High-risk or recently active", PURPLE),
    ]
    for x, val, lab, sub, col in cards:
        kpi(d, x, 240, 560, 130, lab, val, sub, col)

    rr(d, (40, 400, 1480, 1280), 18, WHITE, LINE)
    d.text((64, 424), "Street safety distribution", font=f(18, True), fill=NAVY)
    d.text((64, 456), "46,424 streets  ·  Safe 7,855  ·  Moderate 33,431  ·  Unsafe 5,138", font=f(14), fill=MUTED)
    segs = [(GREEN, 0.169), (MED, 0.720), (HIGH, 0.111)]
    x0, y0, bw = 80, 560, 1320
    x = x0
    for col, share in segs:
        ww = int(bw * share)
        d.rectangle((x, y0, x + ww, y0 + 48), fill=col)
        x += ww
    d.text((80, 630), "Safe 16.9%", font=f(14, True), fill=GREEN)
    d.text((520, 630), "Moderate 72.0%", font=f(14, True), fill=MED)
    d.text((1100, 630), "Unsafe 11.1%", font=f(14, True), fill=HIGH)
    d.text((64, 700), "Highest incident-like areas in this analysis run", font=f(16, True), fill=NAVY)
    areas = [
        ("Bommanahalli", "11 incident-like", "High cell present"),
        ("Attibele", "11 incident-like", "Medium"),
        ("Mysore Road", "10 incident-like", "Medium"),
        ("Sarjapur Road", "9 incident-like", "Medium"),
        ("Devanahalli", "9 incident-like", "Medium"),
        ("JP Nagar", "8 incident-like", "Medium"),
    ]
    y = 750
    for a, b, c in areas:
        rr(d, (64, y, 1420, y + 72), 10, BG)
        d.text((84, y + 22), a, font=f(16, True), fill=NAVY)
        d.text((520, y + 24), b, font=f(15), fill=MUTED)
        d.text((980, y + 24), c, font=f(15), fill=PURPLE)
        y += 84

    rr(d, (1520, 400, 2360, 1280), 18, WHITE, LINE)
    d.text((1544, 424), "Pages on /admin", font=f(18, True), fill=NAVY)
    pages = [
        ("Dashboard", "KPIs, OSM scores, hotspot counts"),
        ("Hotspots", "Filters, table, patrol alerts"),
        ("Map", "Streets + reports + hotspot circles"),
        ("Analytics", "Community safe / unsafe mix"),
        ("Areas", "53 BBMP area comparison"),
        ("Sign in / Sign out", "HttpOnly session cookie"),
    ]
    y = 480
    for t, b in pages:
        d.ellipse((1556, y + 10, 1576, y + 30), fill=PURPLE)
        d.text((1596, y), t, font=f(16, True), fill=NAVY)
        d.text((1596, y + 28), b, font=f(14), fill=MUTED)
        y += 110
    im.save(ASSETS / "safeher-admin-dashboard.png", "PNG", optimize=True)


def filters():
    w, h = 2400, 1350
    im = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(im)
    chrome(im, "Officer session", "https://admin.safeher.local/admin/hotspots")
    nav(d, w, "Hotspots")
    d.text((40, 140), "Hotspots and patrol alerts", font=f(30, True), fill=NAVY)
    d.text((40, 182), "Same filters drive the table, the KPIs and the map  ·  officer selects; nobody emails a sheet", font=f(15), fill=MUTED)

    rr(d, (40, 230, 2360, 430), 18, WHITE, LINE)
    d.text((60, 246), "AUTHORITY FILTERS", font=f(12, True), fill=PURPLE)
    field(d, 60, 276, 330, "Area / region", "All areas")
    field(d, 410, 276, 330, "Incident type", "Harassment")
    field(d, 760, 276, 250, "Risk level", "High")
    field(d, 1030, 276, 260, "Time of day", "All times")
    field(d, 1310, 276, 260, "From date", "2026-06-01")
    field(d, 1590, 276, 260, "To date", "2026-07-14")
    rr(d, (1880, 298, 2020, 338), 8, WHITE, LINE)
    d.text((1910, 308), "Reset", font=f(14, True), fill=NAVY)
    d.text((60, 360), "Options available to the officer", font=f(13, True), fill=MUTED)
    d.text(
        (60, 386),
        "Area: 53 BBMP names   ·   Type: harassment, unsafe feeling, stalking, theft, assault, suspicious, other   ·   Risk: High / Medium / Low   ·   Time: morning, afternoon, evening, night",
        font=f(14),
        fill=INK,
    )

    for i, (lab, val, col) in enumerate(
        [("Matching hotspots", "4", PURPLE), ("High risk in view", "4", HIGH), ("Matching alerts", "4", GREEN)]
    ):
        x = 40 + i * 430
        rr(d, (x, 450, x + 410, 545), 14, WHITE, LINE)
        d.text((x + 24, 468), lab, font=f(13), fill=MUTED)
        d.text((x + 24, 492), val, font=f(28, True), fill=col)

    rr(d, (1330, 450, 2360, 545), 14, WHITE, LINE)
    d.text((1350, 468), "Example selection", font=f(13), fill=MUTED)
    d.text((1350, 494), "Incident type = Harassment   and   Risk = High", font=f(16, True), fill=NAVY)

    rr(d, (40, 565, 2360, 1310), 18, WHITE, LINE)
    headers = [("Area", 70), ("Risk", 430), ("Reports", 640), ("Harassment", 880), ("Peak time", 1160), ("Coordinates", 1460), ("Patrol hint", 1780)]
    d.rectangle((40, 565, 2360, 620), fill=(249, 250, 251))
    for name, x in headers:
        d.text((x, 582), name.upper(), font=f(12, True), fill=MUTED)
    rows = [
        ("Bommanahalli", "High", HIGH, "7", "4", "evening", "12.8900, 77.6400", "Prioritise Bommanahalli near 12.8900, 77.6400"),
        ("HBR Layout", "High", HIGH, "6", "3", "night", "13.0400, 77.6500", "Prioritise HBR Layout near 13.0400, 77.6500"),
        ("Wilson Garden", "High", HIGH, "5", "2", "morning", "12.9500, 77.6100", "Prioritise Wilson Garden near 12.9500, 77.6100"),
        ("HBR Layout", "High", HIGH, "5", "2", "morning", "13.0400, 77.6400", "Prioritise HBR Layout near 13.0400, 77.6400"),
        ("Nagarbhavi", "Medium", MED, "5", "1", "night", "12.9800, 77.5200", "Hidden by Risk = High"),
        ("Hennur", "Medium", MED, "5", "1", "evening", "13.0500, 77.6400", "Hidden by Risk = High"),
    ]
    y = 630
    for i, (area, risk, col, n, har, peak, xy, hint) in enumerate(rows):
        faded = i >= 4
        fill_txt = (180, 184, 190) if faded else INK
        d.text((70, y + 18), area, font=f(16, True), fill=fill_txt)
        if not faded:
            pill(d, 430, y + 14, risk, col)
        else:
            pill(d, 430, y + 14, risk, (200, 200, 200))
        d.text((660, y + 18), n, font=f(16), fill=fill_txt)
        d.text((930, y + 18), har, font=f(16), fill=fill_txt)
        d.text((1160, y + 18), peak, font=f(16), fill=fill_txt)
        d.text((1460, y + 18), xy, font=f(15), fill=fill_txt)
        d.text((1780, y + 18), hint[:42], font=f(14), fill=fill_txt)
        d.line((60, y + 62, 2340, y + 62), fill=LINE)
        y += 72
    d.text((70, 1248), "Grey rows fall outside the current filter and are not shown to the officer.", font=f(14), fill=MUTED)
    im.save(ASSETS / "safeher-dashboard-filters.png", "PNG", optimize=True)


if __name__ == "__main__":
    overview()
    filters()
    print("Wrote dashboard mockups")
