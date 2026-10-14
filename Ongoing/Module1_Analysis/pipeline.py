"""Module 1 — incident analysis pipeline (Anusha K).

Synopsis mapping (sections 6.1–6.8):
  6.1 Data Integration          ingest()
  6.2 Data Pre-processing       preprocess()
  6.3 Incident Analysis         classify() + incident_breakdown()
  6.4 Geospatial Analysis       geospatial_analysis()
  6.5 Hotspot Identification    cluster_hotspots()
  6.6 Risk-Level Assessment     risk_level() + area_stats()
  6.7 Automatic Analysis Update run() after POST /api/incidents
  6.8 API & Result Delivery     api.py + output JSON/CSV/maps/charts

Run from Ongoing/:
  python3 Module1_Analysis/pipeline.py
  python3 Module1_Analysis/api.py          # result APIs for the dashboard
"""
from __future__ import annotations

import argparse
import csv
import json
import shutil
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
INPUT = HERE / "input"
OUTPUT = HERE / "output"
DATABASE = HERE / "database"
DASHBOARD = HERE.parent / "web" / "public" / "data" / "analysis"
MODULE2_DASH = HERE.parent / "Module2_Dashboard" / "public" / "data" / "analysis"
DATASET = HERE.parent / "Dataset" / "Karnataka"

REPORTS = INPUT / "reports.json"
LIVE_REPORTS = INPUT / "live_reports.json"
OSM_DISTRICTS = (
    DATASET / "osm_districts.json"
    if (DATASET / "osm_districts.json").exists()
    else INPUT / "osm_districts.json"
)
CRIME_CONTEXT = (
    DATASET / "crime_context.json"
    if (DATASET / "crime_context.json").exists()
    else INPUT / "crime_context.json"
)

GRID = 0.01  # ~1.1 km
MIN_HOTSPOT = 3
BBOX = (11.5, 18.6, 74.0, 78.6)  # Karnataka south, north, west, east
INCIDENT_TYPES = {
    "harassment",
    "unsafe_feeling",
    "stalking",
    "eve_teasing",
    "verbal_abuse",
    "other",
}


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _time_of_day(r: dict) -> str:
    if r.get("time_of_day"):
        return str(r["time_of_day"]).strip().lower()
    dt = _parse_dt(r.get("created_at"))
    if dt is None:
        return "unknown"
    h = dt.hour
    if h >= 22 or h < 5:
        return "night"
    if h < 12:
        return "morning"
    if h < 17:
        return "afternoon"
    return "evening"


def _load_json(path: Path, default):
    if not path.exists():
        return default
    data = json.loads(path.read_text(encoding="utf-8"))
    return default if data is None else data


def ingest() -> dict:
    """6.1 Existing Excel/OSM + mobile-app incident dump → one dataset."""
    rows: list[dict] = []
    demo = _load_json(REPORTS, [])
    if not isinstance(demo, list):
        demo = demo.get("reports") or []
    for r in demo:
        r = dict(r)
        r.setdefault("is_synthetic", True)
        r.setdefault("status", "approved")
        r["source"] = "reports.json"
        rows.append(r)

    live = _load_json(LIVE_REPORTS, [])
    if isinstance(live, dict):
        live = live.get("reports") or []
    for r in live:
        r = dict(r)
        r["is_synthetic"] = False
        r.setdefault("status", "approved")
        r["source"] = "live_reports.json"
        rows.append(r)

    approved = [
        r
        for r in rows
        if (r.get("status") or "approved") == "approved"
        and r.get("lat") is not None
        and r.get("lon") is not None
    ]
    osm_pack = _load_json(OSM_DISTRICTS, {})
    osm = osm_pack.get("districts") if isinstance(osm_pack, dict) else osm_pack
    osm = osm or []
    crime = _load_json(CRIME_CONTEXT, {})
    return {
        "reports": approved,
        "osm_areas": osm,
        "osm_meta": osm_pack if isinstance(osm_pack, dict) else {},
        "crime_context": crime,
        "counts": {
            "raw": len(rows),
            "approved_with_coords": len(approved),
            "from_reports_json": sum(1 for r in approved if r.get("source") == "reports.json"),
            "from_live": sum(1 for r in approved if r.get("source") == "live_reports.json"),
            "osm_districts": len(osm),
            "crime_districts": len((crime or {}).get("districts") or {}),
        },
    }


def preprocess(reports: list[dict]) -> dict:
    """6.2 Missing values, duplicates, formats, Karnataka lat/lon, categories."""
    south, north, west, east = BBOX
    seen: set[str] = set()
    clean: list[dict] = []
    dropped = {
        "dup": 0,
        "bad_coord": 0,
        "missing_value_filled": 0,
        "category_standardised": 0,
    }
    for r in reports:
        try:
            lat, lon = float(r["lat"]), float(r["lon"])
        except (TypeError, ValueError, KeyError):
            dropped["bad_coord"] += 1
            continue
        if not (south <= lat <= north and west <= lon <= east):
            dropped["bad_coord"] += 1
            continue
        rid = str(r.get("id") or r.get("_id") or f"{lat:.5f}:{lon:.5f}:{r.get('created_at')}")
        if rid in seen:
            dropped["dup"] += 1
            continue
        seen.add(rid)
        row = dict(r)
        row["lat"], row["lon"] = round(lat, 6), round(lon, 6)
        row["_id"] = rid
        if not row.get("created_at"):
            row["created_at"] = datetime.now(timezone.utc).isoformat()
            dropped["missing_value_filled"] += 1
        if not row.get("district") and not row.get("area"):
            row["district"] = "Unknown"
            dropped["missing_value_filled"] += 1
        row["district"] = str(row.get("district") or row.get("area") or "Unknown").strip()
        row["area"] = row["district"]
        row["time_of_day"] = _time_of_day(row)
        kind = (row.get("incident_type") or "").strip().lower().replace(" ", "_")
        if kind and kind not in INCIDENT_TYPES:
            kind = "other"
            dropped["category_standardised"] += 1
        if kind:
            row["incident_type"] = kind
        if row.get("harassment_reported") in ("true", "True", "1", 1):
            row["harassment_reported"] = True
        elif row.get("harassment_reported") in ("false", "False", "0", 0):
            row["harassment_reported"] = False
        clean.append(row)
    return {"before": len(reports), "after": len(clean), "dropped": dropped, "rows": clean}


def is_incident_like(r: dict) -> bool:
    kind = (r.get("report_kind") or "").lower()
    if kind == "incident":
        return True
    if r.get("incident_type"):
        return True
    if r.get("harassment_reported") is True:
        return True
    return r.get("is_safe") is False


def incident_type(r: dict) -> str:
    if r.get("incident_type"):
        return str(r["incident_type"])
    if r.get("harassment_reported"):
        return "harassment"
    return "unsafe_feeling"


def classify(reports: list[dict]) -> list[dict]:
    """6.3 Type, date, time, location, frequency keys for later aggregation."""
    out = []
    for r in reports:
        row = dict(r)
        row["district"] = r.get("district") or r.get("area")
        row["area"] = row["district"]
        row["incident_like"] = is_incident_like(r)
        row["incident_type"] = incident_type(r) if row["incident_like"] else None
        lat, lon = row["lat"], row["lon"]
        row["cell_lat"] = round(lat / GRID) * GRID
        row["cell_lon"] = round(lon / GRID) * GRID
        out.append(row)
    return out


def cell_key(lat: float, lon: float) -> tuple[float, float]:
    return (round(lat / GRID) * GRID, round(lon / GRID) * GRID)


def risk_level(count: int, harassment_n: int) -> str:
    har_share = harassment_n / count if count else 0
    if count >= 8 or (count >= 5 and har_share >= 0.4):
        return "High"
    if count >= 4:
        return "Medium"
    return "Low"


def cluster_hotspots(classified: list[dict]) -> list[dict]:
    """6.5 Spatial concentration + recurrence on a ~1 km grid. Not prediction."""
    incidents = [r for r in classified if r["incident_like"]]
    buckets: dict[tuple[float, float], list[dict]] = defaultdict(list)
    for r in incidents:
        buckets[cell_key(r["lat"], r["lon"])].append(r)

    hotspots = []
    for (lat, lon), group in buckets.items():
        if len(group) < MIN_HOTSPOT:
            continue
        areas = Counter(g.get("area") or "Unknown" for g in group)
        tods = Counter(g.get("time_of_day") or "unknown" for g in group)
        types = Counter(g.get("incident_type") or "unsafe_feeling" for g in group)
        har_n = sum(1 for g in group if g.get("incident_type") == "harassment" or g.get("harassment_reported"))
        dts = [d for d in (_parse_dt(g.get("created_at")) for g in group) if d]
        unique_days = sorted({d.date().isoformat() for d in dts})
        span_days = (max(dts) - min(dts)).days if len(dts) >= 2 else 0
        recurring = len(unique_days) >= 2
        hotspots.append(
            {
                "hotspot_id": f"HS_{lat:.3f}_{lon:.3f}",
                "latitude": round(lat, 5),
                "longitude": round(lon, 5),
                "report_count": len(group),
                "frequency": len(group),
                "harassment_count": har_n,
                "risk_level": risk_level(len(group), har_n),
                "area": areas.most_common(1)[0][0],
                "district": areas.most_common(1)[0][0],
                "areas": [{"area": a, "count": c} for a, c in areas.most_common()],
                "peak_time_of_day": tods.most_common(1)[0][0],
                "time_of_day": dict(tods),
                "incident_types": dict(types),
                "first_seen": min(dts).isoformat() if dts else None,
                "last_seen": max(dts).isoformat() if dts else None,
                "recurrence": recurring,
                "recurrence_unique_days": len(unique_days),
                "recurrence_span_days": span_days,
                "source_note": "App reports clustered on ~1km Karnataka grid. Not KSP street crime points.",
            }
        )
    hotspots.sort(key=lambda h: (-{"High": 3, "Medium": 2, "Low": 1}[h["risk_level"]], -h["report_count"]))
    return hotspots


def geospatial_analysis(classified: list[dict], osm_areas: list[dict], hotspots: list[dict]) -> dict:
    """6.4 Map incidents against OSM district geography. No street-level KSP dots."""
    incidents = [r for r in classified if r["incident_like"]]
    osm_by = {a.get("district"): a for a in osm_areas if a.get("district")}
    by_district: dict[str, list[dict]] = defaultdict(list)
    for r in incidents:
        by_district[r.get("district") or "Unknown"].append(r)

    districts = []
    for name, group in sorted(by_district.items(), key=lambda kv: -len(kv[1])):
        lats = [g["lat"] for g in group]
        lons = [g["lon"] for g in group]
        osm = osm_by.get(name) or {}
        districts.append(
            {
                "district": name,
                "incident_count": len(group),
                "incident_centroid": {
                    "latitude": round(sum(lats) / len(lats), 5),
                    "longitude": round(sum(lons) / len(lons), 5),
                },
                "incident_bbox": {
                    "south": round(min(lats), 5),
                    "north": round(max(lats), 5),
                    "west": round(min(lons), 5),
                    "east": round(max(lons), 5),
                },
                "osm_centroid": {
                    "latitude": osm.get("latitude"),
                    "longitude": osm.get("longitude"),
                }
                if osm.get("latitude") is not None
                else None,
                "osm_street_count": osm.get("osm_street_count"),
                "osm_unsafe_share": osm.get("osm_unsafe_share"),
                "hotspot_cells": sum(1 for h in hotspots if h.get("district") == name),
            }
        )

    occupied_cells = {cell_key(r["lat"], r["lon"]) for r in incidents}
    return {
        "coverage": "Karnataka",
        "bbox": {"south": BBOX[0], "north": BBOX[1], "west": BBOX[2], "east": BBOX[3]},
        "grid_degrees": GRID,
        "occupied_grid_cells": len(occupied_cells),
        "hotspot_cells": len(hotspots),
        "incident_count": len(incidents),
        "districts": districts,
        "note": "OSM street rows are real Overpass extracts (lighting, CCTV, police, hospital, bus, 9-factor score). District centroids are context. Hotspots come from report GPS, not KSP tables. crime_used_as_coordinates = false.",
    }


def area_stats(classified: list[dict], osm_areas: list[dict], hotspots: list[dict]) -> list[dict]:
    osm = {}
    for a in osm_areas:
        if not isinstance(a, dict):
            continue
        key = a.get("district") or a.get("Area") or a.get("area")
        if key:
            osm[key] = a
    by: dict[str, list[dict]] = defaultdict(list)
    for r in classified:
        by[r.get("district") or r.get("area") or "Unknown"].append(r)
    hs_by = Counter(h.get("district") or h["area"] for h in hotspots)
    out = []
    names = set(by) | set(osm)
    for area in names:
        group = by.get(area) or []
        unsafe_n = sum(1 for g in group if g.get("is_safe") is False)
        inc_n = sum(1 for g in group if g.get("incident_like"))
        osm_row = osm.get(area) or {}
        out.append(
            {
                "area": area,
                "district": area,
                "report_count": len(group),
                "unsafe_reports": unsafe_n,
                "incident_like_reports": inc_n,
                "hotspot_cells": hs_by.get(area, 0),
                "osm_street_count": osm_row.get("osm_street_count") or osm_row.get("Street_Count"),
                "osm_unsafe_streets": osm_row.get("osm_unsafe") or osm_row.get("Unsafe"),
                "osm_unsafe_share": osm_row.get("osm_unsafe_share"),
                "osm_risk_level": osm_row.get("osm_risk_level"),
                "osm_cameras": osm_row.get("osm_cameras"),
                "ksp_sexual_harassment_2023": osm_row.get("ksp_sexual_harassment_2023"),
                "risk_level": (
                    "High"
                    if hs_by.get(area, 0) >= 3 or inc_n >= 20 or osm_row.get("osm_risk_level") == "High"
                    else "Medium"
                    if hs_by.get(area, 0) >= 1 or inc_n >= 8 or osm_row.get("osm_risk_level") == "Medium"
                    else "Low"
                ),
            }
        )
    out.sort(key=lambda a: (-{"High": 3, "Medium": 2, "Low": 1}[a["risk_level"]], -a["incident_like_reports"]))
    return out


def make_alerts(hotspots: list[dict], classified: list[dict]) -> list[dict]:
    dts = [d for d in (_parse_dt(r.get("created_at")) for r in classified) if d]
    cutoff = (max(dts) - timedelta(days=14)) if dts else datetime.now(timezone.utc)
    alerts = []
    for h in hotspots:
        last = _parse_dt(h.get("last_seen"))
        recent = last is not None and last >= cutoff
        if h["risk_level"] == "High" or recent:
            alerts.append(
                {
                    "alert_id": f"AL_{h['hotspot_id']}",
                    "hotspot_id": h["hotspot_id"],
                    "area": h["area"],
                    "district": h.get("district") or h["area"],
                    "risk_level": h["risk_level"],
                    "report_count": h["report_count"],
                    "recurrence": h.get("recurrence"),
                    "latitude": h["latitude"],
                    "longitude": h["longitude"],
                    "reason": (
                        "High-risk concentration"
                        if h["risk_level"] == "High"
                        else "Repeated reports in last 14 days of dataset"
                    ),
                    "last_seen": h["last_seen"],
                    "patrol_hint": f"Prioritise {h['area']} near {h['latitude']:.4f}, {h['longitude']:.4f}",
                }
            )
    return alerts


def incident_breakdown(classified: list[dict]) -> dict:
    incidents = [r for r in classified if r["incident_like"]]
    return {
        "total_reports": len(classified),
        "incident_like": len(incidents),
        "safe_reports": sum(1 for r in classified if r.get("is_safe") is True),
        "unsafe_reports": sum(1 for r in classified if r.get("is_safe") is False),
        "harassment_flagged": sum(1 for r in classified if r.get("harassment_reported")),
        "synthetic": sum(1 for r in classified if r.get("is_synthetic")),
        "live": sum(1 for r in classified if not r.get("is_synthetic")),
        "recurring_hotspot_share_note": "See hotspots.json recurrence fields",
        "by_time_of_day": dict(Counter(r.get("time_of_day") or "unknown" for r in incidents)),
        "by_type": dict(Counter(r.get("incident_type") or "unsafe_feeling" for r in incidents)),
        "by_area_top": Counter(r.get("area") for r in incidents).most_common(10),
        "by_district": dict(Counter(r.get("district") or r.get("area") for r in incidents)),
    }


def _incident_view(classified: list[dict]) -> list[dict]:
    keep = (
        "_id",
        "lat",
        "lon",
        "area",
        "district",
        "created_at",
        "time_of_day",
        "is_safe",
        "harassment_reported",
        "incident_like",
        "incident_type",
        "cell_lat",
        "cell_lon",
        "is_synthetic",
        "source",
        "status",
        "nearest_street",
    )
    return [{k: r.get(k) for k in keep} for r in classified if r["incident_like"]]


def _write(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2), encoding="utf-8")


def _write_csv(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for row in rows:
            w.writerow({k: row.get(k) for k in fieldnames})


def _svg_bars(title: str, items: list[tuple[str, float, str]], path: Path) -> None:
    """stdlib SVG stand-in for Matplotlib/Plotly bar charts (pandas/mpl SIGSEGV on this machine)."""
    width, height, left, bottom, top = 720, 360, 140, 40, 48
    usable = height - bottom - top
    max_v = max((v for _, v, _ in items), default=1) or 1
    bar_h = max(18, int(usable / max(len(items), 1)) - 6)
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#0b1f3a"/>',
        f'<text x="24" y="28" fill="#d4af37" font-family="Helvetica,Arial,sans-serif" font-size="16">{title}</text>',
    ]
    for i, (label, value, color) in enumerate(items):
        y = top + i * (bar_h + 6)
        bw = int((width - left - 48) * (value / max_v))
        parts.append(f'<text x="16" y="{y + bar_h * 0.7}" fill="#e8eef7" font-size="12" font-family="Helvetica,Arial,sans-serif">{label}</text>')
        parts.append(f'<rect x="{left}" y="{y}" width="{bw}" height="{bar_h}" fill="{color}" rx="3"/>')
        parts.append(f'<text x="{left + bw + 8}" y="{y + bar_h * 0.7}" fill="#e8eef7" font-size="12">{int(value)}</text>')
    parts.append("</svg>")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(parts), encoding="utf-8")


def _leaflet_map(hotspots: list[dict], path: Path) -> None:
    """Folium/Leaflet hotspot map. Points are app-report clusters, not KSP street crime."""
    payload = json.dumps(hotspots)
    html = f"""<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8"/>
<title>SafeHer Karnataka hotspots</title>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map {{ height:100%; margin:0; font-family:Helvetica,Arial,sans-serif; }}
  .legend {{ position:absolute; bottom:16px; left:16px; z-index:500; background:#0b1f3a; color:#e8eef7;
            padding:10px 12px; border:1px solid #d4af37; font-size:13px; }}
  .dot {{ display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:6px; }}
</style>
</head><body>
<div id="map"></div>
<div class="legend">
  <div><span class="dot" style="background:#c0392b"></span>High risk</div>
  <div><span class="dot" style="background:#e67e22"></span>Medium risk</div>
  <div><span class="dot" style="background:#d4af37"></span>Low risk</div>
  <div style="margin-top:6px">Historical concentration · Karnataka · not prediction</div>
</div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const hotspots = {payload};
const map = L.map('map').setView([14.52, 76.0], 7);
L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
  attribution: '&copy; OpenStreetMap'
}}).addTo(map);
const color = {{High:'#c0392b', Medium:'#e67e22', Low:'#d4af37'}};
hotspots.forEach(h => {{
  L.circleMarker([h.latitude, h.longitude], {{
    radius: Math.min(18, 6 + h.report_count),
    color: color[h.risk_level] || '#d4af37',
    fillColor: color[h.risk_level] || '#d4af37',
    fillOpacity: 0.7, weight: 1
  }}).bindPopup(
    `<b>${{h.district}}</b><br>${{h.risk_level}} · ${{h.report_count}} reports` +
    `<br>Recurrence: ${{h.recurrence ? 'yes (' + h.recurrence_unique_days + ' days)' : 'no'}}` +
    (h.nearest_street ? `<br>${{h.nearest_street.street_name || h.nearest_street.street_id}} · OSM ${{h.nearest_street.safety_level}} (${{h.nearest_street.infra_safety_score}})` +
      `<br>Lighting ${{h.nearest_street.factor_lighting}} · CCTV ${{h.nearest_street.factor_cctv}} · Police ${{h.nearest_street.police_distance_m}} m` : '')
  ).addTo(map);
}});
</script>
</body></html>
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html, encoding="utf-8")


def persist_database(hotspots, alerts, areas, incidents, geo, summary) -> None:
    """JSON document store (MongoDB-shaped collections for demo / viva)."""
    DATABASE.mkdir(parents=True, exist_ok=True)
    _write(DATABASE / "incidents.json", incidents)
    _write(DATABASE / "hotspots.json", hotspots)
    _write(DATABASE / "alerts.json", alerts)
    _write(DATABASE / "areas.json", areas)
    _write(DATABASE / "geography.json", geo)
    _write(DATABASE / "statistics.json", summary)
    _write(
        DATABASE / "meta.json",
        {
            "engine": "json-files",
            "mongo_equivalent": ["incidents", "hotspots", "alerts", "areas", "geography", "statistics"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )


def publish(names: list[str]) -> list[str]:
    copied = []
    for dest in (DASHBOARD, MODULE2_DASH):
        dest.mkdir(parents=True, exist_ok=True)
        for name in names:
            src = OUTPUT / name
            if not src.exists():
                continue
            dst = dest / name
            if src.is_dir():
                if dst.exists():
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
            else:
                shutil.copyfile(src, dst)
            copied.append(str(dst))
    return copied


STREET_FIELDS = (
    "street_id",
    "street_name",
    "highway",
    "safety_level",
    "infra_safety_score",
    "lit",
    "factor_lighting",
    "factor_cctv",
    "factor_police",
    "factor_hospital",
    "factor_bus",
    "cctv_within_100m",
    "lamp_count_300m",
    "police_distance_m",
    "hospital_distance_m",
    "bus_stop_count",
    "distance_m",
    "data_source",
)


def _street_slim(m: dict) -> dict:
    return {k: m.get(k) for k in STREET_FIELDS}


def attach_nearest_streets(hotspots: list[dict], classified: list[dict], matches: list[dict]) -> None:
    """Join real OSM street features (synopsis lighting/CCTV/police/bus/score) onto points."""
    hs = {m["point_id"]: m for m in matches if m.get("point_kind") == "hotspot"}
    inc = {str(m.get("point_id")): m for m in matches if m.get("point_kind") == "incident"}
    for h in hotspots:
        m = hs.get(h["hotspot_id"])
        if m:
            h["nearest_street"] = _street_slim(m)
    for r in classified:
        rid = str(r.get("_id") or r.get("report_id") or r.get("id") or "")
        m = inc.get(rid)
        if m:
            r["nearest_street"] = _street_slim(m)


def filter_region(items: list[dict], district: str | None = None, risk: str | None = None) -> list[dict]:
    out = items
    if district:
        d = district.strip().lower()
        out = [x for x in out if str(x.get("district") or x.get("area") or "").lower() == d]
    if risk:
        r = risk.strip().lower()
        out = [x for x in out if str(x.get("risk_level") or "").lower() == r]
    return out


def _self_check(hotspots: list[dict], alerts: list[dict], classified: list[dict], geo: dict) -> None:
    assert classified, "no reports after preprocess"
    assert hotspots, "expected at least one ~1km hotspot"
    for h in hotspots:
        assert h["report_count"] >= MIN_HOTSPOT
        assert h["risk_level"] in {"Low", "Medium", "High"}
        assert "recurrence" in h
        assert 11.5 < h["latitude"] < 18.6
        assert 74.0 < h["longitude"] < 78.6
    assert all("patrol_hint" in a for a in alerts)
    assert geo.get("districts")
    sw = geo.get("street_wise") or {}
    if "error" not in sw:
        assert (sw.get("streets_scanned") or 0) > 1000
        assert sw.get("by_safety_level")
        assert any(h.get("nearest_street") for h in hotspots)
    print("SELF-CHECK OK", len(hotspots), "hotspots,", len(alerts), "alerts,", len(geo["districts"]), "districts")


def run(*, write_dashboard: bool = True) -> dict:
    log = {"started_at": datetime.now(timezone.utc).isoformat(), "steps": []}

    packed = ingest()
    log["steps"].append({"step": "6.1", "name": "data_integration", **packed["counts"]})

    pre = preprocess(packed["reports"])
    log["steps"].append(
        {"step": "6.2", "name": "preprocess", "before": pre["before"], "after": pre["after"], "dropped": pre["dropped"]}
    )

    classified = classify(pre["rows"])
    incidents = [r for r in classified if r["incident_like"]]
    stats = incident_breakdown(classified)
    log["steps"].append(
        {
            "step": "6.3",
            "name": "incident_analysis",
            "incident_like": len(incidents),
            "safe_or_context": len(classified) - len(incidents),
            "by_type": stats["by_type"],
        }
    )

    hotspots = cluster_hotspots(classified)
    geo = geospatial_analysis(classified, packed["osm_areas"], hotspots)
    street_info = {}
    try:
        import streetwise

        street_info = streetwise.run(classified, hotspots)
        matches = _load_json(OUTPUT / "street_matches.json", [])
        attach_nearest_streets(hotspots, classified, matches if isinstance(matches, list) else [])
        by_st = (street_info.get("street_stats") or {}).get("by_district") or {}
        for d in geo["districts"]:
            st = by_st.get(d["district"]) or {}
            d["osm_streets"] = st.get("streets")
            d["osm_safe"] = st.get("Safe")
            d["osm_moderate"] = st.get("Moderate")
            d["osm_unsafe"] = st.get("Unsafe")
            d["osm_avg_infra_score"] = st.get("avg_score")
        geo["street_wise"] = {
            "streets_scanned": street_info["street_stats"]["streets_scanned"],
            "by_safety_level": street_info["street_stats"]["by_safety_level"],
            "avg_infra_safety_score": street_info["street_stats"]["avg_infra_safety_score"],
            "matched_incidents": street_info["street_stats"]["matched_incidents"],
            "matched_hotspots": street_info["street_stats"]["matched_hotspots"],
            "cameras": street_info["cameras"],
            "synopsis_features": street_info["street_stats"]["synopsis_features"],
        }
    except Exception as e:
        geo["street_wise"] = {"error": str(e)}
        print("streetwise skipped:", e)
    log["steps"].append(
        {
            "step": "6.4",
            "name": "geospatial_analysis",
            "occupied_grid_cells": geo["occupied_grid_cells"],
            "districts_with_incidents": len(geo["districts"]),
            "streets_scanned": (geo.get("street_wise") or {}).get("streets_scanned"),
        }
    )
    log["steps"].append(
        {
            "step": "6.5",
            "name": "hotspot_identification",
            "grid_degrees": GRID,
            "hotspot_count": len(hotspots),
            "recurring": sum(1 for h in hotspots if h.get("recurrence")),
        }
    )

    risk_counts = dict(Counter(h["risk_level"] for h in hotspots))
    areas = area_stats(classified, packed["osm_areas"], hotspots)
    log["steps"].append({"step": "6.6", "name": "risk_level_assessment", "risk_counts": risk_counts})

    alerts = make_alerts(hotspots, classified)
    log["steps"].append({"step": "6.7", "name": "automatic_analysis_update", "alert_count": len(alerts)})

    crime = packed["crime_context"] or {}
    summary = {
        "module": "Incident Analysis, Geospatial Analysis and Hotspot Identification",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "folder": str(HERE),
        "preprocess": {k: pre[k] for k in ("before", "after", "dropped")},
        "stats": stats,
        "hotspot_count": len(hotspots),
        "alert_count": len(alerts),
        "risk_counts": risk_counts,
        "recurring_hotspots": sum(1 for h in hotspots if h.get("recurrence")),
        "grid_degrees": GRID,
        "min_reports_per_hotspot": MIN_HOTSPOT,
        "coverage": "Karnataka — 30 districts",
        "honesty": {
            "reports": "App-schema community reports for Karnataka districts (synthetic demo unless live_reports.json has rows).",
            "hotspots": "Spatial concentration of unsafe/incident-like reports on a ~1 km grid. Not crime prediction.",
            "osm": "Real Karnataka OSM streets (Overpass extract): 9-factor infrastructure proxy per street (lighting, CCTV, police, hospital, bus, road, crowd/night/commercial proxies). Not a crime rate.",
            "crime_overlay": crime.get("note")
            or "KSP tables are district aggregates. They are not used as hotspot coordinates.",
        },
        "inputs": {
            "dataset": str(DATASET),
            "reports": str(REPORTS),
            "live_reports": str(LIVE_REPORTS),
            "osm_districts": str(OSM_DISTRICTS),
            "crime_context": str(CRIME_CONTEXT),
            "crime_used_as_coordinates": False,
        },
        "osm_workbook": {
            "total_streets": packed["osm_meta"].get("workbook_total_streets"),
            "avg_score": packed["osm_meta"].get("workbook_avg_score"),
            "cameras": packed["osm_meta"].get("workbook_cameras"),
            "as_of": packed["osm_meta"].get("as_of"),
        },
        "street_wise": street_info.get("street_stats") if isinstance(street_info, dict) else None,
    }

    OUTPUT.mkdir(parents=True, exist_ok=True)
    incident_view = _incident_view(classified)
    _write(OUTPUT / "incident_view.json", incident_view)
    _write(OUTPUT / "hotspots.json", hotspots)
    _write(OUTPUT / "alerts.json", alerts)
    _write(OUTPUT / "areas.json", areas)
    _write(OUTPUT / "geography.json", geo)
    _write(OUTPUT / "summary.json", summary)

    csv_dir = OUTPUT / "csv"
    _write_csv(
        csv_dir / "hotspots.csv",
        [
            {
                **h,
                "street_id": (h.get("nearest_street") or {}).get("street_id"),
                "street_name": (h.get("nearest_street") or {}).get("street_name"),
                "safety_level": (h.get("nearest_street") or {}).get("safety_level"),
                "infra_safety_score": (h.get("nearest_street") or {}).get("infra_safety_score"),
            }
            for h in hotspots
        ],
        [
            "hotspot_id",
            "district",
            "latitude",
            "longitude",
            "report_count",
            "harassment_count",
            "risk_level",
            "recurrence",
            "recurrence_unique_days",
            "peak_time_of_day",
            "first_seen",
            "last_seen",
            "street_id",
            "street_name",
            "safety_level",
            "infra_safety_score",
        ],
    )
    _write_csv(
        csv_dir / "incidents.csv",
        incident_view,
        ["_id", "district", "lat", "lon", "created_at", "time_of_day", "incident_type", "harassment_reported"],
    )
    _write_csv(
        csv_dir / "areas.csv",
        areas,
        ["district", "report_count", "incident_like_reports", "hotspot_cells", "risk_level", "osm_unsafe_share", "osm_street_count", "osm_cameras"],
    )
    _write_csv(
        csv_dir / "alerts.csv",
        alerts,
        ["alert_id", "district", "risk_level", "report_count", "latitude", "longitude", "reason", "patrol_hint"],
    )

    colors = {"High": "#c0392b", "Medium": "#e67e22", "Low": "#d4af37"}
    _svg_bars(
        "Hotspots by risk level (Karnataka)",
        [(k, risk_counts.get(k, 0), colors[k]) for k in ("High", "Medium", "Low")],
        OUTPUT / "charts" / "risk_levels.svg",
    )
    top = sorted(geo["districts"], key=lambda d: -d["incident_count"])[:10]
    _svg_bars(
        "Incident frequency by district (top 10)",
        [(d["district"], d["incident_count"], "#4a90d9") for d in top],
        OUTPUT / "charts" / "incidents_by_district.svg",
    )
    _leaflet_map(hotspots, OUTPUT / "maps" / "hotspots.html")

    persist_database(hotspots, alerts, areas, incident_view, geo, summary)
    for name in ("street_stats.json", "street_matches.json", "cameras.json"):
        src = OUTPUT / name
        if src.exists():
            shutil.copyfile(src, DATABASE / name)

    dash = []
    if write_dashboard:
        dash = publish(
            [
                "summary.json",
                "hotspots.json",
                "alerts.json",
                "areas.json",
                "geography.json",
                "street_stats.json",
                "street_matches.json",
                "cameras.json",
                "maps",
                "charts",
                "csv",
            ]
        )
    log["steps"].append({"step": "6.8", "name": "api_and_result_delivery", "dashboard_files": len(dash)})
    log["finished_at"] = datetime.now(timezone.utc).isoformat()
    log["output"] = str(OUTPUT)
    _write(OUTPUT / "pipeline_log.json", log)

    _self_check(hotspots, alerts, classified, geo)
    return summary


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(description="SafeHer Module 1 analysis pipeline")
    p.add_argument("--no-dashboard", action="store_true", help="Write Module1_Analysis/output only")
    p.add_argument("--refresh-streets", action="store_true", help="Rescan 30 district OSM workbooks")
    args = p.parse_args(argv)
    if args.refresh_streets:
        import os as _os

        _os.environ["SAFEHER_REFRESH_STREETS"] = "1"
    summary = run(write_dashboard=not args.no_dashboard)
    print(
        json.dumps(
            {
                k: summary[k]
                for k in ("generated_at", "hotspot_count", "alert_count", "risk_counts", "recurring_hotspots", "stats")
            },
            indent=2,
        )
    )
    print("Wrote", OUTPUT)
    if not args.no_dashboard:
        print("Published", DASHBOARD)
        print("Published", MODULE2_DASH)


if __name__ == "__main__":
    main()
