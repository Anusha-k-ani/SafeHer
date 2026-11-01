"""Phase 2 geospatial and temporal intelligence. Stdlib only.

Grid clustering remains the published hotspot method. DBSCAN and a conservative
KDE run as comparison only. Empty cells are never labelled safe.
"""
from __future__ import annotations

import json
import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATASET = HERE.parent / "Dataset" / "Karnataka"
GEOJSON = (
    DATASET / "karnataka_districts.geojson"
    if (DATASET / "karnataka_districts.geojson").exists()
    else HERE / "input" / "karnataka_districts.geojson"
)

GRID = 0.01
MIN_HOTSPOT = 3
RECENT_DAYS = 14
PRIOR_DAYS = 14
DBSCAN_EPS_DEG = 0.015
KDE_SIGMA_DEG = 0.01

_POLY_CACHE: list[dict] | None = None


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def event_time(row: dict) -> tuple[datetime | None, str]:
    occurred = _parse_dt(row.get("occurred_at"))
    if occurred:
        return occurred, "occurred_at"
    created = _parse_dt(row.get("created_at"))
    if created:
        return created, "created_at_fallback"
    return None, "missing"


def cell_key(lat: float, lon: float) -> tuple[float, float]:
    return (round(lat / GRID) * GRID, round(lon / GRID) * GRID)


def _ring_contains(lon: float, lat: float, ring: list) -> bool:
    inside = False
    n = len(ring)
    if n < 3:
        return False
    j = n - 1
    for i in range(n):
        xi, yi = float(ring[i][0]), float(ring[i][1])
        xj, yj = float(ring[j][0]), float(ring[j][1])
        intersects = ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-15) + xi)
        if intersects:
            inside = not inside
        j = i
    return inside


def _poly_contains(lon: float, lat: float, coords) -> bool:
    if not coords:
        return False
    if not _ring_contains(lon, lat, coords[0]):
        return False
    for hole in coords[1:]:
        if _ring_contains(lon, lat, hole):
            return False
    return True


def load_district_polygons() -> list[dict]:
    global _POLY_CACHE
    if _POLY_CACHE is not None:
        return _POLY_CACHE
    if not GEOJSON.exists():
        _POLY_CACHE = []
        return _POLY_CACHE
    pack = json.loads(GEOJSON.read_text(encoding="utf-8"))
    out = []
    for feat in pack.get("features") or []:
        props = feat.get("properties") or {}
        name = props.get("district_name") or props.get("district") or ""
        geom = feat.get("geometry") or {}
        gtype = geom.get("type")
        raw = geom.get("coordinates") or []
        polys = raw if gtype == "MultiPolygon" else [raw]
        boxes = []
        for poly in polys:
            xs, ys = [], []
            for ring in poly:
                for x, y, *_ in ring:
                    xs.append(float(x))
                    ys.append(float(y))
            if xs:
                boxes.append((min(xs), min(ys), max(xs), max(ys)))
        out.append({"district": name, "polys": polys, "boxes": boxes})
    _POLY_CACHE = out
    return out


def assign_district(lat: float | None, lon: float | None, polygons: list[dict] | None = None) -> dict:
    if lat is None or lon is None:
        return {"district": None, "district_match": "missing_coordinates"}
    polys = polygons if polygons is not None else load_district_polygons()
    if not polys:
        return {"district": None, "district_match": "no_polygon_file"}
    hits = []
    for item in polys:
        if not any(x0 <= lon <= x1 and y0 <= lat <= y1 for x0, y0, x1, y1 in item["boxes"]):
            continue
        if any(_poly_contains(lon, lat, poly) for poly in item["polys"]):
            hits.append(item["district"])
    if len(hits) == 1:
        return {"district": hits[0], "district_match": "polygon"}
    if len(hits) > 1:
        return {"district": hits[0], "district_match": "uncertain_overlap"}
    return {"district": None, "district_match": "outside_polygons"}


def apply_districts(rows: list[dict]) -> list[dict]:
    polys = load_district_polygons()
    out = []
    for r in rows:
        row = dict(r)
        hit = assign_district(row.get("lat"), row.get("lon"), polys)
        reported = row.get("district") or row.get("area")
        if hit["district_match"] == "polygon":
            row["district"] = hit["district"]
            row["area"] = hit["district"]
            row["district_match"] = "polygon"
            if reported and reported != hit["district"]:
                row["district_reported"] = reported
        elif hit["district_match"] == "uncertain_overlap":
            row["district"] = hit["district"] or reported
            row["area"] = row["district"]
            row["district_match"] = "uncertain_overlap"
        elif reported:
            row["district"] = reported
            row["area"] = reported
            row["district_match"] = "reported_not_in_polygon" if hit["district_match"] == "outside_polygons" else hit["district_match"]
        else:
            row["district"] = None
            row["area"] = None
            row["district_match"] = hit["district_match"]
        out.append(row)
    return out


def temporal_analysis(classified: list[dict]) -> dict:
    incidents = [r for r in classified if r.get("incident_like")]
    quality = Counter()
    daily: Counter = Counter()
    weekly: Counter = Counter()
    monthly: Counter = Counter()
    hours = Counter()
    weekdays = Counter()
    sources = Counter()
    dated: list[tuple[datetime, dict]] = []
    for r in incidents:
        dt, src = event_time(r)
        quality[src] += 1
        sources["synthetic" if r.get("is_synthetic") else "operational"] += 1
        if not dt:
            continue
        dated.append((dt, r))
        daily[dt.date().isoformat()] += 1
        iso = dt.isocalendar()
        weekly[f"{iso.year}-W{iso.week:02d}"] += 1
        monthly[dt.strftime("%Y-%m")] += 1
        hours[dt.hour] += 1
        weekdays[dt.strftime("%A")] += 1

    span_days = (max(d for d, _ in dated) - min(d for d, _ in dated)).days if len(dated) >= 2 else 0
    months = sorted(monthly)
    first_half = second_half = 0
    if dated:
        mid = min(d for d, _ in dated) + timedelta(days=max(span_days, 1) / 2)
        first_half = sum(1 for d, _ in dated if d < mid)
        second_half = sum(1 for d, _ in dated if d >= mid)

    weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return {
        "timestamp_quality": {
            "occurred_at": quality.get("occurred_at", 0),
            "created_at_fallback": quality.get("created_at_fallback", 0),
            "missing": quality.get("missing", 0),
            "note": "Occurrence time is used when it parses. created_at is a fallback and is labelled.",
        },
        "evidence": dict(sources),
        "span_days": span_days,
        "daily": [{"date": k, "count": daily[k]} for k in sorted(daily)],
        "weekly": [{"week": k, "count": weekly[k]} for k in sorted(weekly)],
        "monthly": [{"month": k, "count": monthly[k]} for k in months],
        "hour_of_day": [{"hour": h, "count": hours.get(h, 0)} for h in range(24)],
        "day_of_week": [{"day": d, "count": weekdays.get(d, 0)} for d in weekday_order],
        "date_range_comparison": {
            "first_half_count": first_half,
            "second_half_count": second_half,
            "interpretation": "Counts in the first and second halves of the observed span. Not a safety improvement claim.",
        },
        "seasonal": {
            "supported": len(months) >= 12,
            "months_present": months,
            "reason": "Seasonal comparison needs a full year of occurrence times. This extract covers fewer than 12 months.",
        },
    }


def _window_counts(classified: list[dict], end: datetime, recent_days: int, prior_days: int) -> tuple[Counter, Counter]:
    recent_cut = end - timedelta(days=recent_days)
    prior_cut = recent_cut - timedelta(days=prior_days)
    recent: Counter = Counter()
    prior: Counter = Counter()
    for r in classified:
        if not r.get("incident_like"):
            continue
        dt, _ = event_time(r)
        if not dt:
            continue
        key = cell_key(r["lat"], r["lon"])
        if recent_cut < dt <= end:
            recent[key] += 1
        elif prior_cut < dt <= recent_cut:
            prior[key] += 1
    return recent, prior


def classify_evolution(hotspots: list[dict], classified: list[dict]) -> list[dict]:
    """Label observed activity change. Declining counts are not 'safer'."""
    times = [event_time(r)[0] for r in classified if r.get("incident_like")]
    times = [t for t in times if t]
    end = max(times) if times else datetime.now(timezone.utc)
    recent, prior = _window_counts(classified, end, RECENT_DAYS, PRIOR_DAYS)
    out = []
    for h in hotspots:
        key = cell_key(h["latitude"], h["longitude"])
        r_n, p_n = recent[key], prior[key]
        unique_days = h.get("recurrence_unique_days") or 0
        span = h.get("recurrence_span_days") or 0
        if r_n >= MIN_HOTSPOT and p_n < MIN_HOTSPOT:
            label = "emerging"
            why = f"At least {MIN_HOTSPOT} approved points in the last {RECENT_DAYS} days and fewer than {MIN_HOTSPOT} in the previous {PRIOR_DAYS} days."
        elif p_n >= MIN_HOTSPOT and r_n < 0.5 * p_n:
            label = "declining_observed"
            why = f"Recent count {r_n} is under half of the prior-window count {p_n}. This is fewer reports, not proof the place is safer."
        elif r_n >= MIN_HOTSPOT and p_n >= MIN_HOTSPOT and r_n >= 0.7 * p_n:
            label = "persistent"
            why = f"The cell met the minimum in both {PRIOR_DAYS}-day windows and recent activity held ({r_n} vs {p_n})."
        elif unique_days >= 2 and span >= 7:
            label = "recurring"
            why = f"Approved points on {unique_days} distinct days over {span} days."
        elif unique_days >= 2:
            label = "recurring"
            why = f"Approved points on {unique_days} distinct days."
        else:
            label = "observed"
            why = "The cell meets the minimum count in the full period. Windows do not yet support a stronger label."
        row = dict(h)
        row["evolution_class"] = label
        row["evolution_explanation"] = why
        row["recent_count"] = r_n
        row["prior_count"] = p_n
        row["window_end"] = end.isoformat()
        row["incident_concern"] = h.get("risk_level")
        street = h.get("nearest_street") or {}
        row["environmental_concern"] = street.get("safety_level")
        row["patrol_priority"] = None
        row["patrol_priority_note"] = "Not computed. A patrol formula is not validated on this data."
        out.append(row)
    return out


def compare_methods(classified: list[dict]) -> dict:
    incidents = [r for r in classified if r.get("incident_like")]
    points = [(r["lat"], r["lon"]) for r in incidents]
    grid_cells = Counter(cell_key(lat, lon) for lat, lon in points)
    grid_hot = sum(1 for _, n in grid_cells.items() if n >= MIN_HOTSPOT)

    labels = _dbscan(points, DBSCAN_EPS_DEG, MIN_HOTSPOT)
    cluster_ids = {lab for lab in labels if lab >= 0}
    noise = sum(1 for lab in labels if lab < 0)

    kde_hot = _kde_hot_cells(points, KDE_SIGMA_DEG, MIN_HOTSPOT)

    return {
        "default": "grid",
        "min_evidence": MIN_HOTSPOT,
        "why_grid": "Cells are explainable (~1 km), the three-point rule is public, and empty cells stay unlabelled. DBSCAN shapes are harder to defend in a viva. KDE can warm neighbouring empty cells, which this project forbids presenting as risk.",
        "grid": {"cell_degrees": GRID, "hotspot_cells": grid_hot, "occupied_cells": len(grid_cells)},
        "dbscan": {
            "eps_degrees": DBSCAN_EPS_DEG,
            "min_samples": MIN_HOTSPOT,
            "clusters": len(cluster_ids),
            "noise_points": noise,
            "published": False,
        },
        "kde": {
            "sigma_degrees": KDE_SIGMA_DEG,
            "threshold": "density equal to three coincident points at a cell centre",
            "cells_above_threshold": kde_hot,
            "published": False,
            "note": "Comparison only. Not a safety surface.",
        },
        "decision": "Keep the 0.01° grid and MIN_HOTSPOT=3 as the published method.",
    }


def _dbscan(points: list[tuple[float, float]], eps: float, min_samples: int) -> list[int]:
    n = len(points)
    labels = [-1] * n
    cluster = 0
    for i, (lat, lon) in enumerate(points):
        if labels[i] != -1:
            continue
        nbrs = [j for j, (a, b) in enumerate(points) if (a - lat) ** 2 + (b - lon) ** 2 <= eps * eps]
        if len(nbrs) < min_samples:
            continue
        labels[i] = cluster
        queue = [j for j in nbrs if j != i]
        seen = set(nbrs)
        while queue:
            j = queue.pop()
            if labels[j] == -1:
                labels[j] = cluster
            aj, bj = points[j]
            more = [k for k, (a, b) in enumerate(points) if (a - aj) ** 2 + (b - bj) ** 2 <= eps * eps]
            if len(more) >= min_samples:
                for k in more:
                    if k not in seen:
                        seen.add(k)
                        queue.append(k)
            elif labels[j] == -1:
                labels[j] = cluster
        cluster += 1
    return labels


def _kde_hot_cells(points: list[tuple[float, float]], sigma: float, min_points: int) -> int:
    """Count occupied-neighbour cells whose Gaussian mass >= three points at the centre."""
    if not points:
        return 0
    threshold = float(min_points)
    cells = {cell_key(lat, lon) for lat, lon in points}
    extra = set()
    for lat, lon in cells:
        for da in (-GRID, 0, GRID):
            for db in (-GRID, 0, GRID):
                extra.add((round(lat + da, 5), round(lon + db, 5)))
    hot = 0
    two_s2 = 2 * sigma * sigma
    for clat, clon in extra:
        dens = 0.0
        for lat, lon in points:
            d2 = (lat - clat) ** 2 + (lon - clon) ** 2
            dens += math.exp(-d2 / two_s2)
        if dens >= threshold:
            hot += 1
    return hot


def coverage(raw_rows: list[dict], classified: list[dict], ingest_counts: dict, store_pack: dict, generated_at: str) -> dict:
    store_reports = (store_pack or {}).get("reports") or []
    missing_coord = 0
    missing_time = 0
    missing_occurred = 0
    created_fallback = 0
    for r in raw_rows:
        if r.get("lat") is None or r.get("lon") is None:
            missing_coord += 1
        src = event_time(r)[1]
        if src == "missing":
            missing_time += 1
            missing_occurred += 1
        elif src == "created_at_fallback":
            created_fallback += 1
            missing_occurred += 1
    matches = Counter(r.get("district_match") or "unknown" for r in classified)
    districts = {r.get("district") for r in classified if r.get("district")}
    return {
        "eligible_incidents": sum(1 for r in classified if r.get("incident_like")),
        "verified_operational": ingest_counts.get("from_store_verified", 0),
        "provisional_store": ingest_counts.get("from_store_pending", 0),
        "synthetic_approved": ingest_counts.get("from_reports_json", 0),
        "legacy_live_approved": ingest_counts.get("from_live", 0),
        "legacy_live_pending": ingest_counts.get("from_live_pending", 0),
        "store_submitted": sum(1 for r in store_reports if r.get("status") == "submitted"),
        "store_under_review": sum(1 for r in store_reports if r.get("status") == "under_review"),
        "store_verified": sum(1 for r in store_reports if r.get("status") == "verified"),
        "store_flagged": sum(1 for r in store_reports if r.get("status") == "flagged"),
        "missing_coordinates_in_raw": missing_coord,
        "missing_occurrence_times": missing_time,
        "missing_occurred_at": missing_occurred,
        "created_at_fallback_times": created_fallback,
        "district_match": dict(matches),
        "districts_with_classified_rows": len(districts),
        "districts_in_state": 30,
        "geographic_coverage_note": "A district with no classified rows is uncovered, not safe.",
        "last_successful_analysis": generated_at,
        "sources": {
            "synthetic_demo": "reports.json",
            "operational": "suraksha-store.json verified rows",
            "legacy_live": "live_reports.json only if already approved/verified",
        },
    }


def enrich_hotspots(hotspots: list[dict], classified: list[dict]) -> list[dict]:
    polys = load_district_polygons()
    out = []
    for h in hotspots:
        row = dict(h)
        syn = 0
        live = 0
        key = cell_key(h["latitude"], h["longitude"])
        for r in classified:
            if not r.get("incident_like"):
                continue
            if cell_key(r["lat"], r["lon"]) != key:
                continue
            if r.get("is_synthetic"):
                syn += 1
            else:
                live += 1
        row["synthetic_count"] = syn
        row["operational_count"] = live
        row["evidence_category"] = "mixed" if syn and live else ("operational" if live else "synthetic")
        hit = assign_district(h["latitude"], h["longitude"], polys)
        if hit["district"]:
            row["district"] = hit["district"]
            row["district_match"] = hit["district_match"]
        else:
            row["district_match"] = hit["district_match"]
        dts = []
        for r in classified:
            if not r.get("incident_like"):
                continue
            if cell_key(r["lat"], r["lon"]) != key:
                continue
            dt, _ = event_time(r)
            if dt:
                dts.append(dt)
        if dts:
            row["first_seen"] = min(dts).isoformat()
            row["last_seen"] = max(dts).isoformat()
            days = sorted({d.date().isoformat() for d in dts})
            row["recurrence_unique_days"] = len(days)
            row["recurrence_span_days"] = (max(dts) - min(dts)).days
            row["recurrence"] = len(days) >= 2
        row["explanation"] = (
            f"Grid cell ~1 km with {row.get('report_count')} approved points "
            f"({syn} labelled demo, {live} operational). "
            f"Incident concern {row.get('risk_level')}. Not a forecast."
        )
        out.append(row)
    return classify_evolution(out, classified)
