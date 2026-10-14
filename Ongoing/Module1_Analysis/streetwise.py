#!/usr/bin/env python3
"""Street-wise OSM layer for Module 1 (synopsis 6.4 / street safety dataset).

Real sources only:
  - Karnataka OSM streets (by_district Excel, from Overpass extract)
  - OSM Overpass surveillance nodes + OpenCity Bengaluru CCTV KML
  - KSP stays district grain and is never used as street coordinates

Hotspots still come from community GPS reports (demo until live_reports.json).
This module attaches those points to the nearest real OSM street and classifies
public cameras. Live police video / FRS / stream scraping are out of scope.
"""
from __future__ import annotations

import csv
import json
import math
import os
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

HERE = Path(__file__).resolve().parent
DATASET = HERE.parent / "Dataset" / "Karnataka"
BY_DISTRICT = DATASET / "by_district"
OFFICIAL_KML = DATASET / "official" / "bengaluru-cctv-cameras__Bengaluru_-_CCTV_Cameras_Map.kml"
CAMERA_JSON = DATASET / "karnataka_cameras.json"
GODSEYE_DIR = DATASET / "godseye"
OUTPUT = HERE / "output"
INPUT = HERE / "input"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
BBOX = (11.5, 18.6, 74.0, 78.6)
MATCH_M = 450.0
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]
GEV_MAX = 900
UA = "SafeHer-Module1/1.0 (academic; Karnataka street safety)"

KEEP = [
    "street_id",
    "osm_way_id",
    "street_name",
    "district_name",
    "latitude",
    "longitude",
    "highway",
    "surface",
    "lit",
    "bus_stop_count",
    "police_distance_m",
    "hospital_distance_m",
    "lamp_count_300m",
    "cctv_within_100m",
    "cctv_within_250m",
    "cctv_within_500m",
    "nearest_camera_m",
    "infra_safety_score",
    "safety_level",
    "confidence",
    "factor_police",
    "factor_hospital",
    "factor_lighting",
    "factor_bus",
    "factor_cctv",
    "factor_road",
    "proxy_crowd",
    "proxy_night",
    "proxy_commercial",
    "lighting_is_proxy",
    "data_source",
]


def _num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _haversine(lat1, lon1, lat2, lon2) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _col_index(ref: str) -> int:
    letters = "".join(ch for ch in ref if ch.isalpha())
    n = 0
    for ch in letters:
        n = n * 26 + ord(ch.upper()) - 64
    return n - 1


def _cell_value(el, strings: list[str]):
    t = el.attrib.get("t")
    is_elem = el.find(f"{NS}is")
    v = el.find(f"{NS}v")
    if t == "inlineStr" and is_elem is not None:
        return "".join(is_elem.itertext())
    if v is None:
        return None
    if t == "s":
        return strings[int(v.text)]
    return v.text


def iter_xlsx_rows(path: Path):
    with ZipFile(path) as z:
        strings: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall(f"{NS}si"):
                strings.append("".join(si.itertext()))
        header = None
        ctx = ET.iterparse(z.open("xl/worksheets/sheet1.xml"), events=("end",))
        for _, el in ctx:
            if el.tag != f"{NS}row":
                continue
            cells: dict[int, str | None] = {}
            for c in el:
                if c.tag != f"{NS}c":
                    continue
                ref = c.attrib.get("r", "A1")
                cells[_col_index(ref)] = _cell_value(c, strings)
            if not cells:
                el.clear()
                continue
            width = max(cells) + 1
            row = [cells.get(i) for i in range(width)]
            if header is None:
                header = [str(x or "").strip() for x in row]
            else:
                rec = {header[i]: row[i] if i < len(row) else None for i in range(len(header))}
                yield rec
            el.clear()


def compact_street(raw: dict) -> dict | None:
    lat, lon = _num(raw.get("latitude")), _num(raw.get("longitude"))
    if lat is None or lon is None:
        return None
    if not (BBOX[0] <= lat <= BBOX[1] and BBOX[2] <= lon <= BBOX[3]):
        return None
    out = {}
    for k in KEEP:
        v = raw.get(k)
        if k in ("latitude", "longitude") or k.startswith("factor_") or k.endswith("_m") or k.endswith("_count") or "cctv_within" in k or k in ("infra_safety_score", "confidence", "bus_stop_count", "lamp_count_300m"):
            out[k] = _num(v) if k not in ("street_id", "street_name", "district_name", "highway", "surface", "lit", "safety_level", "data_source", "lighting_is_proxy") else v
        else:
            out[k] = v
    out["latitude"] = round(lat, 6)
    out["longitude"] = round(lon, 6)
    out["infra_safety_score"] = _num(raw.get("infra_safety_score"))
    out["safety_level"] = (raw.get("safety_level") or "").strip() or None
    out["district_name"] = (raw.get("district_name") or "").strip()
    out["data_source"] = raw.get("data_source") or "OpenStreetMap via Overpass"
    return out


def classify_camera(tags: dict, source: str) -> dict:
    tags = {str(k): str(v) for k, v in (tags or {}).items() if v is not None}
    zone = (tags.get("surveillance") or tags.get("surveillance:zone") or "unknown").lower()
    kind = (tags.get("surveillance:type") or tags.get("camera:type") or "camera").lower()
    mount = (tags.get("camera:mount") or "").lower()
    indoor = zone == "indoor" or tags.get("indoor") == "yes"
    public = zone in ("public", "outdoor", "area") or kind in ("camera", "webcam")
    if indoor:
        setting = "indoor"
    elif zone in ("public", "outdoor", "area") or public:
        setting = "public_outdoor"
    else:
        setting = "unspecified"
    return {
        "camera_class": kind,
        "setting": setting,
        "mount": mount or None,
        "operator": tags.get("operator") or tags.get("operator:type") or None,
        "is_public_context": setting == "public_outdoor",
        "source": source,
        "tags": tags,
    }


def load_inventory_cameras() -> list[dict]:
    """Statewide OSM + OpenCity camera positions from the Karnataka parquet dump."""
    if not CAMERA_JSON.exists():
        return []
    data = json.loads(CAMERA_JSON.read_text(encoding="utf-8"))
    cams = []
    for raw in data.get("cameras") or []:
        lat, lon = raw.get("latitude"), raw.get("longitude")
        if lat is None or lon is None:
            continue
        tags = raw.get("tags") or {}
        if isinstance(tags, str):
            try:
                tags = json.loads(tags)
            except json.JSONDecodeError:
                tags = {}
        src = raw.get("source") or "osm"
        cls = classify_camera(tags, src)
        cams.append(
            {
                "camera_id": raw.get("camera_id"),
                "osm_id": raw.get("osm_id"),
                "latitude": float(lat),
                "longitude": float(lon),
                "district_name": raw.get("district_name"),
                "district_code": raw.get("district_code"),
                "as_of": raw.get("as_of"),
                **cls,
            }
        )
    return cams


def load_cached_streets() -> dict | None:
    stats_path = OUTPUT / "street_stats.json"
    matches_path = OUTPUT / "street_matches.json"
    if not stats_path.exists() or not matches_path.exists():
        return None
    pack = json.loads(stats_path.read_text(encoding="utf-8"))
    if int(pack.get("streets_scanned") or 0) < 1000:
        return None
    pack["matches"] = json.loads(matches_path.read_text(encoding="utf-8"))
    return pack


def load_osm_cameras_overpass() -> list[dict]:
    south, north, west, east = BBOX[0], BBOX[1], BBOX[2], BBOX[3]
    query = f"""
[out:json][timeout:120];
(
  node["man_made"="surveillance"]({south},{west},{north},{east});
  node["man_made"="camera"]({south},{west},{north},{east});
);
out body;
""".strip()
    data = None
    last = None
    body = query.encode()
    for url in OVERPASS_URLS:
        req = urllib.request.Request(url, data=body, headers={"User-Agent": UA, "Content-Type": "application/x-www-form-urlencoded"})
        try:
            with urllib.request.urlopen(req, timeout=150) as resp:
                data = json.loads(resp.read().decode())
            break
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            last = e
    if data is None:
        print("Overpass camera fetch skipped:", last)
        return []
    cams = []
    for el in data.get("elements") or []:
        if el.get("type") != "node":
            continue
        lat, lon = el.get("lat"), el.get("lon")
        if lat is None or lon is None:
            continue
        tags = el.get("tags") or {}
        cls = classify_camera(tags, "osm_overpass")
        cams.append(
            {
                "camera_id": f"osm_node_{el.get('id')}",
                "osm_id": el.get("id"),
                "latitude": float(lat),
                "longitude": float(lon),
                **cls,
            }
        )
    return cams


def load_official_kml() -> list[dict]:
    if not OFFICIAL_KML.exists():
        return []
    root = ET.parse(OFFICIAL_KML).getroot()
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"
    cams = []
    for pm in root.iter(f"{ns}Placemark"):
        coords = pm.find(f".//{ns}coordinates")
        if coords is None or not (coords.text or "").strip():
            continue
        lon_s, lat_s, *_ = coords.text.strip().split(",")
        try:
            lat, lon = float(lat_s), float(lon_s)
        except ValueError:
            continue
        tags = {}
        for data in pm.findall(f".//{ns}Data"):
            name = data.attrib.get("name")
            val = data.findtext(f"{ns}value")
            if name:
                tags[name] = val
        name = pm.findtext(f"{ns}name")
        if name:
            tags["name"] = name
        cls = classify_camera(tags, "opencity_kml")
        oid = tags.get("@id") or f"kml_{len(cams)}"
        cams.append(
            {
                "camera_id": f"official_{oid.replace('/', '_')}",
                "osm_id": None,
                "latitude": lat,
                "longitude": lon,
                "district_name": "Bengaluru Urban",
                **cls,
            }
        )
    return cams


def merge_cameras(osm: list[dict], official: list[dict], dedupe_m: float = 25.0) -> list[dict]:
    merged = list(official)
    for cam in osm:
        dup = False
        for o in official:
            if _haversine(cam["latitude"], cam["longitude"], o["latitude"], o["longitude"]) <= dedupe_m:
                dup = True
                break
        if not dup:
            merged.append(cam)
    return merged


def nearest_street(lat: float, lon: float, streets: list[dict]) -> tuple[dict, float] | None:
    best = None
    best_d = MATCH_M + 1
    for s in streets:
        d = _haversine(lat, lon, s["latitude"], s["longitude"])
        if d < best_d:
            best, best_d = s, d
    if best is None:
        return None
    return best, best_d


def analyse_streets(classified: list[dict], hotspots: list[dict]) -> dict:
    incidents = [r for r in classified if r.get("incident_like") and r.get("lat") is not None]
    points = [{"kind": "incident", "id": r.get("report_id") or r.get("id") or r.get("_id"), "lat": r["lat"], "lon": r["lon"], "district": r.get("district")} for r in incidents]
    points += [{"kind": "hotspot", "id": h.get("hotspot_id"), "lat": h["latitude"], "lon": h["longitude"], "district": h.get("district")} for h in hotspots]

    by_district_pts: dict[str, list] = defaultdict(list)
    for p in points:
        by_district_pts[p["district"] or ""].append(p)

    stats = {
        "streets_scanned": 0,
        "by_safety_level": Counter(),
        "by_district": {},
        "feature_coverage": Counter(),
        "avg_score_sum": 0.0,
        "avg_score_n": 0,
        "unlit_tag": 0,
        "lit_yes": 0,
        "with_cctv_100m": 0,
        "highway": Counter(),
    }
    matches = []
    files = sorted(BY_DISTRICT.glob("*.xlsx"))
    if not files:
        raise FileNotFoundError(f"No district street workbooks in {BY_DISTRICT}")

    for path in files:
        streets = []
        dname = None
        for raw in iter_xlsx_rows(path):
            rec = compact_street(raw)
            if not rec:
                continue
            streets.append(rec)
            dname = rec["district_name"] or dname
            stats["streets_scanned"] += 1
            lvl = rec.get("safety_level") or "Unknown"
            stats["by_safety_level"][lvl] += 1
            if rec.get("infra_safety_score") is not None:
                stats["avg_score_sum"] += rec["infra_safety_score"]
                stats["avg_score_n"] += 1
            if rec.get("lit") == "yes":
                stats["lit_yes"] += 1
            if rec.get("lit") in (None, "", "no"):
                stats["unlit_tag"] += 1
            if (rec.get("cctv_within_100m") or 0) > 0:
                stats["with_cctv_100m"] += 1
            if rec.get("highway"):
                stats["highway"][rec["highway"]] += 1
            for feat in ("factor_lighting", "factor_cctv", "factor_police", "factor_hospital", "factor_bus"):
                if rec.get(feat) is not None:
                    stats["feature_coverage"][feat] += 1
        if dname:
            lvl_c = Counter(s.get("safety_level") or "Unknown" for s in streets)
            scores = [s["infra_safety_score"] for s in streets if s.get("infra_safety_score") is not None]
            stats["by_district"][dname] = {
                "streets": len(streets),
                "Safe": lvl_c.get("Safe", 0),
                "Moderate": lvl_c.get("Moderate", 0),
                "Unsafe": lvl_c.get("Unsafe", 0),
                "avg_score": round(sum(scores) / len(scores), 3) if scores else None,
            }
        want = by_district_pts.get(dname or "", [])
        # also try filename aliases
        if not want:
            key = path.stem.replace("_", " ")
            want = by_district_pts.get(key, [])
        for p in want:
            hit = nearest_street(p["lat"], p["lon"], streets)
            if not hit:
                continue
            street, dist = hit
            matches.append(
                {
                    "point_kind": p["kind"],
                    "point_id": p["id"],
                    "point_district": p["district"],
                    "distance_m": round(dist, 1),
                    "street_id": street.get("street_id"),
                    "street_name": street.get("street_name"),
                    "highway": street.get("highway"),
                    "safety_level": street.get("safety_level"),
                    "infra_safety_score": street.get("infra_safety_score"),
                    "lit": street.get("lit"),
                    "lighting_is_proxy": street.get("lighting_is_proxy"),
                    "factor_lighting": street.get("factor_lighting"),
                    "factor_cctv": street.get("factor_cctv"),
                    "factor_police": street.get("factor_police"),
                    "factor_hospital": street.get("factor_hospital"),
                    "factor_bus": street.get("factor_bus"),
                    "cctv_within_100m": street.get("cctv_within_100m"),
                    "lamp_count_300m": street.get("lamp_count_300m"),
                    "police_distance_m": street.get("police_distance_m"),
                    "hospital_distance_m": street.get("hospital_distance_m"),
                    "bus_stop_count": street.get("bus_stop_count"),
                    "data_source": street.get("data_source"),
                }
            )
        print(f"  streets {path.stem}: {len(streets)}  matches +{sum(1 for m in matches if m['point_district']==dname)}", flush=True)
        del streets

    avg = round(stats["avg_score_sum"] / stats["avg_score_n"], 3) if stats["avg_score_n"] else None
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "note": "Street rows are real OSM Overpass extracts. Scores are a 9-factor infrastructure proxy, not a crime rate. KSP is not joined as street coordinates.",
        "synopsis_features": [
            "lighting (OSM lit / lamps / factor_lighting)",
            "CCTV proximity (cctv_within_100/250/500m, factor_cctv)",
            "police distance",
            "hospital distance",
            "bus-stop density",
            "road class (highway, factor_road)",
            "proxy_crowd / proxy_night / proxy_commercial",
            "infra_safety_score and Safe / Moderate / Unsafe",
        ],
        "streets_scanned": stats["streets_scanned"],
        "avg_infra_safety_score": avg,
        "by_safety_level": dict(stats["by_safety_level"]),
        "by_district": stats["by_district"],
        "highway": dict(stats["highway"].most_common()),
        "lit_yes": stats["lit_yes"],
        "with_cctv_100m": stats["with_cctv_100m"],
        "feature_rows_with_factor": dict(stats["feature_coverage"]),
        "matches": matches,
        "matched_incidents": sum(1 for m in matches if m["point_kind"] == "incident"),
        "matched_hotspots": sum(1 for m in matches if m["point_kind"] == "hotspot"),
        "match_radius_m": MATCH_M,
        "crime_used_as_coordinates": False,
    }


def camera_to_gev(cam: dict) -> dict:
    district = cam.get("district_name") or "Karnataka"
    cid = str(cam.get("camera_id"))
    return {
        "id": cid,
        "name": f"{district} · {cid}",
        "city": district,
        "cityId": "karnataka",
        "provider": "SafeHer OSM / OpenCity public camera inventory (Karnataka)",
        "sourceKind": cam.get("source") or "osm",
        "feedType": "image",
        "url": "",
        "snapshotUrl": "",
        "lat": round(cam["latitude"], 7),
        "lon": round(cam["longitude"], 7),
        "headingDeg": 0,
        "pitchDeg": -15,
        "fovDeg": 70,
        "rangeM": 80,
        "note": "Position only. No live police stream.",
    }


def write_outputs(street_pack: dict, cameras: list[dict]) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    csv_dir = OUTPUT / "csv"
    csv_dir.mkdir(parents=True, exist_ok=True)
    GODSEYE_DIR.mkdir(parents=True, exist_ok=True)
    INPUT.mkdir(parents=True, exist_ok=True)

    stats = {k: v for k, v in street_pack.items() if k != "matches"}
    (OUTPUT / "street_stats.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")
    (OUTPUT / "street_matches.json").write_text(json.dumps(street_pack["matches"], indent=2), encoding="utf-8")
    (OUTPUT / "cameras.json").write_text(
        json.dumps(
            {
                "count": len(cameras),
                "public_outdoor": sum(1 for c in cameras if c.get("is_public_context")),
                "by_class": dict(Counter(c.get("camera_class") for c in cameras)),
                "by_source": dict(Counter(c.get("source") for c in cameras)),
                "note": "Public camera locations from Karnataka OSM Overpass extract + OpenCity Bengaluru KML. Positions only. Not live video. Not FRS.",
                "cameras": cameras,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    if street_pack["matches"]:
        fields = list(street_pack["matches"][0].keys())
        with open(csv_dir / "street_matches.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            w.writeheader()
            w.writerows(street_pack["matches"])

    district_rows = [{"district": k, **v} for k, v in street_pack["by_district"].items()]
    if district_rows:
        with open(csv_dir / "streets_by_district.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=list(district_rows[0].keys()))
            w.writeheader()
            w.writerows(district_rows)

    gev = [camera_to_gev(c) for c in cameras if c.get("is_public_context")][:GEV_MAX]
    catalog = {
        "cityId": "karnataka",
        "name": "Karnataka public cameras (SafeHer)",
        "maxSources": GEV_MAX,
        "note": "God's Eye View catalog of positions only. Empty url = no live stream.",
        "sources": gev,
    }
    (GODSEYE_DIR / "godseye_cctv_sources.json").write_text(json.dumps(catalog, indent=2), encoding="utf-8")
    (GODSEYE_DIR / "godseye_export_meta.json").write_text(
        json.dumps(
            {
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "camera_count": len(cameras),
                "gev_sources": len(gev),
                "repo": "https://github.com/bilawalsidhu/gods-eye-view",
                "live_video": False,
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (INPUT / "street_stats.json").write_text(json.dumps(stats, indent=2), encoding="utf-8")


def collect_cameras() -> list[dict]:
    cameras = load_inventory_cameras()
    if cameras:
        return cameras
    print("Camera inventory JSON missing — Overpass + OpenCity KML…", flush=True)
    return merge_cameras(load_osm_cameras_overpass(), load_official_kml())


def run(classified: list[dict], hotspots: list[dict], *, refresh: bool = False) -> dict:
    refresh = refresh or os.environ.get("SAFEHER_REFRESH_STREETS") == "1"
    street_pack = None if refresh else load_cached_streets()
    if street_pack is None:
        print("Street-wise OSM scan (30 district workbooks)…", flush=True)
        street_pack = analyse_streets(classified, hotspots)
    else:
        print("Street-wise cache:", street_pack["streets_scanned"], "streets", flush=True)
    cameras = collect_cameras()
    write_outputs(street_pack, cameras)
    assert street_pack["streets_scanned"] > 1000, "street scan too small"
    assert street_pack["by_safety_level"], "no safety_level counts"
    assert cameras, "expected real OSM/OpenCity cameras"
    print(
        "STREETWISE OK",
        street_pack["streets_scanned"],
        "streets",
        dict(street_pack["by_safety_level"]),
        "cams",
        len(cameras),
        "matches",
        len(street_pack["matches"]),
    )
    return {"street_stats": {k: v for k, v in street_pack.items() if k != "matches"}, "cameras": len(cameras), "matches": len(street_pack["matches"])}


if __name__ == "__main__":
    import pipeline

    packed = pipeline.ingest()
    pre = pipeline.preprocess(packed["reports"])
    classified = pipeline.classify(pre["rows"])
    hotspots = pipeline.cluster_hotspots(classified)
    run(classified, hotspots)
