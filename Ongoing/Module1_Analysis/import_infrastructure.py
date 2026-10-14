#!/usr/bin/env python3
"""Import publicly queryable Karnataka street-light records and write coverage stats.

The original street workbook, street CSVs and camera file are not modified.
A street-light fitting code on an electricity pole is not proof the lamp works.
A district with no CCTV row is a gap in the inventory, not proof that no camera exists.
"""

from __future__ import annotations

import csv
import http.client
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATASET = HERE.parent / "Dataset"
STREET_DIR = DATASET / "Karnataka_Streetwise" / "csv"
CAMERAS = DATASET / "Karnataka" / "karnataka_cameras.json"
DISTRICTS = DATASET / "Karnataka" / "karnataka_districts.geojson"
OUT_DIR = HERE / "input" / "infrastructure"
POLE_CSV = OUT_DIR / "ksrsac_lt_poles_streetlight_type.csv"
CHECKPOINT = OUT_DIR / "ksrsac_poles.checkpoint.json"
COVERAGE = HERE.parents[0] / "web" / "public" / "data" / "analysis" / "infrastructure_coverage.json"

POLE_URL = "https://kgis.ksrsac.in/kgismaps2/rest/services/Energy/Energy/MapServer/5/query"
PAGE = 1000
BBOX = (74.0, 11.5, 78.6, 18.6)  # lon min, lat min, lon max, lat max
STEP = 0.02
USER_AGENT = "SafeHerPhase2/2.0 (academic research)"

# Count published by the same service on 2026-10-14. Used only to know when to stop.
EXPECTED_POLES = 1074618

SOURCES = [
    {
        "id": "ksrsac-lt-poles",
        "name": "KSRSAC K-GIS Energy / LT poles with STREET_LIGHT_TYPE",
        "url": "https://kgis.ksrsac.in/kgismaps2/rest/services/Energy/Energy/MapServer/5",
        "provider": "Karnataka State Remote Sensing Applications Centre",
        "access": "Public ArcGIS query. No login. Records are electricity poles whose street-light fitting field is filled.",
        "coverage": "Five ESCOMs (BESCOM, CESCOM, GESCOM, HESCOM, MESCOM). Not a municipal street-light work order.",
    },
    {
        "id": "ksrsac-bbmp-streetlight",
        "name": "KSRSAC Energy / StreetLight - BBMP",
        "url": "https://kgis.ksrsac.in/kgismaps2/rest/services/Energy/StreetLight/MapServer/0",
        "provider": "KSRSAC",
        "access": "Public query. Counted, not bulk-copied: 548,857 points, all Bengaluru (BBMP, BECC, BESCOM).",
        "coverage": "Bengaluru only. Extent about 77.45-77.84 E, 12.95-13.30 N.",
    },
    {
        "id": "opencity-bbmp-zones",
        "name": "BBMP zone street-light lists via OpenCity",
        "url": "https://data.opencity.in/dataset/bengaluru-zone-wise-streetlights",
        "provider": "BBMP tenders, republished by OpenCity",
        "access": "Public domain. Four zone KMLs (Dasarahalli, RR Nagar, East, Bommanahalli), about 193 MB.",
        "coverage": "Four Bengaluru zones. Not downloaded in this pass because the KSRSAC Bengaluru layer already counts that city and disk space was under 1 GB.",
    },
    {
        "id": "ksrsac-streetlight-app",
        "name": "KSRSAC RDPR Street Light mobile app",
        "url": "https://play.google.com/store/apps/details?id=com.ksrsac.RDPRStreetLights",
        "provider": "KSRSAC",
        "access": "App only. The public RDPR map service has no street-light layer. Support: kgissupport@ksrsac.in",
        "coverage": "The store text says the whole state. The underlying points are not on a public download.",
    },
    {
        "id": "k-gis-downloads",
        "name": "K-GIS downloads page",
        "url": "https://kgis.ksrsac.in/kgis/downloads.aspx",
        "provider": "KSRSAC",
        "access": "Administrative boundaries only. The page says K-GIS data has social and commercial value and misuse can lead to legal proceedings.",
        "coverage": "No street-light or CCTV file.",
    },
    {
        "id": "existing-cameras",
        "name": "Project camera inventory",
        "url": "Dataset/Karnataka/karnataka_cameras.json",
        "provider": "OpenStreetMap extract plus OpenCity Bengaluru KML",
        "access": "Already in the project. OSM is crowdsourced. OpenCity Bengaluru cameras are crowdsourced from OSM.",
        "coverage": "5,578 positions. Not an official Karnataka Police inventory.",
    },
    {
        "id": "ksp-cctv",
        "name": "Karnataka Police CCTV geotag register",
        "url": "https://ksp.karnataka.gov.in/",
        "provider": "Karnataka State Police",
        "access": "No public GeoJSON or API. Safe City and God's Eye camera streams are not public. K-GIS Home Department layers list police stations, not cameras.",
        "coverage": "Unknown. Missing rows must not be read as missing cameras.",
    },
    {
        "id": "data-gov-bengaluru-cctv",
        "name": "data.gov.in Bangalore CCTV catalog",
        "url": "https://ap.data.gov.in/catalog/bangalore-cctv-cameras",
        "provider": "Bengaluru Smart City Limited",
        "access": "Catalog page has no downloadable file. Contact: bsclnodal@gmail.com",
        "coverage": "Bengaluru only, and the file is not actually available.",
    },
]


def fetch(url: str, timeout: int = 90) -> dict:
    last_error: Exception | None = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode())
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ConnectionError, http.client.IncompleteRead) as error:
            last_error = error
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"request failed after retries: {last_error}")


def point_in_ring(x: float, y: float, ring: list) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def load_districts() -> list[dict]:
    data = json.loads(DISTRICTS.read_text())
    districts = []
    for feature in data["features"]:
        geom = feature["geometry"]
        if geom["type"] == "Polygon":
            rings = [geom["coordinates"][0]]
        else:
            rings = [polygon[0] for polygon in geom["coordinates"]]
        xs = [p[0] for ring in rings for p in ring]
        ys = [p[1] for ring in rings for p in ring]
        districts.append({
            "name": feature["properties"]["district_name"],
            "bbox": (min(xs), min(ys), max(xs), max(ys)),
            "rings": rings,
        })
    return districts


def build_grid(districts: list[dict]) -> dict[tuple[int, int], str]:
    lon0, lat0, lon1, lat1 = BBOX
    grid = {}
    x_cells = int((lon1 - lon0) / STEP)
    y_cells = int((lat1 - lat0) / STEP)
    for ix in range(x_cells):
        for iy in range(y_cells):
            lon = lon0 + (ix + 0.5) * STEP
            lat = lat0 + (iy + 0.5) * STEP
            hits = []
            for district in districts:
                minx, miny, maxx, maxy = district["bbox"]
                if not (minx <= lon <= maxx and miny <= lat <= maxy):
                    continue
                if any(point_in_ring(lon, lat, ring) for ring in district["rings"]):
                    hits.append(district["name"])
            if len(hits) == 1:
                grid[(ix, iy)] = hits[0]
            elif hits:
                grid[(ix, iy)] = "boundary"
            else:
                grid[(ix, iy)] = "outside"
    return grid


def district_of(grid: dict[tuple[int, int], str], lon: float, lat: float) -> str:
    lon0, lat0, lon1, lat1 = BBOX
    if not (lon0 <= lon <= lon1 and lat0 <= lat <= lat1):
        return "outside_karnataka"
    ix = int((lon - lon0) / STEP)
    iy = int((lat - lat0) / STEP)
    return grid.get((ix, iy), "outside")


def number(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def scan_streets() -> dict:
    by_district: dict[str, dict] = {}
    for path in sorted(STREET_DIR.glob("*_streets.csv")):
        with path.open(newline="") as handle:
            for row in csv.DictReader(handle):
                name = row.get("district_name") or "unknown"
                bucket = by_district.setdefault(name, {
                    "district": name,
                    "streets": 0,
                    "lamp_within_300m": 0,
                    "lit_tag_filled": 0,
                    "cctv_within_500m": 0,
                    "nearest_camera_filled": 0,
                })
                bucket["streets"] += 1
                lamps = number(row.get("lamp_count_300m"))
                if lamps is not None and lamps > 0:
                    bucket["lamp_within_300m"] += 1
                if (row.get("lit") or "").strip():
                    bucket["lit_tag_filled"] += 1
                cameras = number(row.get("cctv_within_500m"))
                if cameras is not None and cameras > 0:
                    bucket["cctv_within_500m"] += 1
                if number(row.get("nearest_camera_m")) is not None:
                    bucket["nearest_camera_filled"] += 1
    rows = sorted(by_district.values(), key=lambda item: item["district"])
    return {
        "streets": sum(item["streets"] for item in rows),
        "districts_with_streets": len(rows),
        "lamp_within_300m": sum(item["lamp_within_300m"] for item in rows),
        "lit_tag_filled": sum(item["lit_tag_filled"] for item in rows),
        "cctv_within_500m": sum(item["cctv_within_500m"] for item in rows),
        "note": "These counts come from the district street CSVs (604,420 rows). The workbook summary records 604,573 scored streets. lamp_within_300m is an OSM street with at least one mapped lamp within 300 m. A zero is a gap in the map, not proof a street is unlit. lit_tag_filled is the OSM lit tag, which is mostly empty.",
        "by_district": rows,
    }


def scan_cameras(canonical: list[str]) -> dict:
    payload = json.loads(CAMERAS.read_text())
    rows = payload["cameras"]
    counts: dict[str, int] = {}
    sources: dict[str, int] = {}
    for camera in rows:
        name = camera.get("district_name") or "unknown"
        counts[name] = counts.get(name, 0) + 1
        source = camera.get("source") or "unknown"
        sources[source] = sources.get(source, 0) + 1
    present = set(counts)
    return {
        "cameras": len(rows),
        "sources": sources,
        "districts_with_records": sorted(present),
        "districts_without_records": [name for name in canonical if name not in present],
        "by_district": [{"district": name, "cameras": counts[name]} for name in sorted(counts)],
        "note": "Positions from the existing project file. OSM and OpenCity are not a Karnataka Police camera register. A district in districts_without_records has no row in this file.",
    }


def load_coverage() -> dict:
    if COVERAGE.exists():
        return json.loads(COVERAGE.read_text())
    return {}


def write_coverage(payload: dict) -> None:
    COVERAGE.parent.mkdir(parents=True, exist_ok=True)
    temporary = COVERAGE.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(payload, indent=2))
    temporary.replace(COVERAGE)


def summarise_poles(grid: dict[tuple[int, int], str] | None = None) -> dict:
    authorities: dict[str, int] = {}
    districts: dict[str, int] = {}
    status: dict[str, int] = {}
    rows = 0
    invalid = 0
    outside = 0
    if POLE_CSV.exists():
        with POLE_CSV.open(newline="") as handle:
            for row in csv.DictReader(handle):
                rows += 1
                authority = row.get("authority") or "unknown"
                authorities[authority] = authorities.get(authority, 0) + 1
                asset_status = row.get("asset_status") or "unknown"
                status[asset_status] = status.get(asset_status, 0) + 1
                district = row.get("district") or "unknown"
                districts[district] = districts.get(district, 0) + 1
                if district == "outside_karnataka":
                    outside += 1
                if row.get("valid") == "no":
                    invalid += 1
    checkpoint = json.loads(CHECKPOINT.read_text()) if CHECKPOINT.exists() else {}
    return {
        "file": str(POLE_CSV.relative_to(HERE)),
        "rows": rows,
        "expected_query_count": EXPECTED_POLES,
        "import_complete": checkpoint.get("complete", False),
        "pages_done": len(checkpoint.get("done_offsets", [])),
        "invalid_coordinates": invalid,
        "outside_karnataka_bbox": outside,
        "by_authority": authorities,
        "by_status": status,
        "by_district": [{"district": name, "poles": districts[name]} for name in sorted(districts)],
        "district_method": "0.02 degree cell of the district polygon. Cells whose centre falls outside every district, or on a shared edge, are labelled outside or boundary.",
        "status_note": "asset_status describes the electricity pole in the KSRSAC record. street_light_type is a fitting code such as '1 TL-1'. Neither field proves the lamp is working on the retrieval date.",
        "retrieved_at": checkpoint.get("retrieved_at"),
        "grid_built": grid is not None,
    }


def refresh_coverage(grid_ready: bool = False) -> dict:
    payload = load_coverage()
    if "base_dataset" not in payload:
        print("scanning streets", flush=True)
        payload["base_dataset"] = scan_streets()
    if "cctv" not in payload:
        print("scanning cameras", flush=True)
        canonical = [item["name"] for item in load_districts()]
        payload["cctv"] = scan_cameras(canonical)
    payload["streetlights"] = summarise_poles()
    payload["streetlights"]["grid_built"] = grid_ready or payload["streetlights"].get("grid_built", False)
    payload["sources"] = SOURCES
    payload["generated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    payload["title"] = "Incident Analysis and Hotspot Identification for Security Provision against Women Harassment in Public Spaces."
    write_coverage(payload)
    return payload


def pole_page(offset: int) -> list[dict]:
    query = urllib.parse.urlencode({
        "where": "STREET_LIGHT_TYPE IS NOT NULL AND STREET_LIGHT_TYPE <> ''",
        "outFields": "OBJECTID,ASSETID,STREET_LIGHT_TYPE,ASSET_STATUS,ESCOMCODE,Authority",
        "returnGeometry": "true",
        "outSR": "4326",
        "orderByFields": "OBJECTID",
        "resultOffset": str(offset),
        "resultRecordCount": str(PAGE),
        "f": "json",
    })
    data = fetch(POLE_URL + "?" + query)
    if data.get("error"):
        raise RuntimeError(str(data["error"]))
    return data.get("features") or []


def append_poles(features: list[dict], grid: dict[tuple[int, int], str], writer: csv.writer) -> int:
    written = 0
    for feature in features:
        attrs = feature.get("attributes") or {}
        geom = feature.get("geometry") or {}
        lon = geom.get("x")
        lat = geom.get("y")
        valid = isinstance(lon, (int, float)) and isinstance(lat, (int, float))
        district = district_of(grid, float(lon), float(lat)) if valid else "invalid"
        writer.writerow([
            attrs.get("OBJECTID"),
            attrs.get("ASSETID"),
            attrs.get("Authority") or "",
            attrs.get("ESCOMCODE") or "",
            attrs.get("ASSET_STATUS") or "",
            attrs.get("STREET_LIGHT_TYPE") or "",
            lon if valid else "",
            lat if valid else "",
            district,
            "yes" if valid else "no",
        ])
        written += 1
    return written


def download_poles() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    checkpoint = json.loads(CHECKPOINT.read_text()) if CHECKPOINT.exists() else {
        "done_offsets": [],
        "retrieved_at": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "complete": False,
    }
    done = set(checkpoint["done_offsets"])
    new_file = not POLE_CSV.exists()
    print("building district grid", flush=True)
    grid = build_grid(load_districts())
    centre = district_of(grid, 77.5946, 12.9716)
    if centre not in ("Bengaluru Urban", "boundary"):
        raise SystemExit(f"district grid failed for Bengaluru: {centre}")
    handle = POLE_CSV.open("a", newline="")
    writer = csv.writer(handle)
    if new_file:
        writer.writerow([
            "object_id", "asset_id", "authority", "escom_code", "asset_status",
            "street_light_type", "lon", "lat", "district", "valid",
        ])
    offset = 0
    try:
        while offset < EXPECTED_POLES:
            if offset not in done:
                started = time.time()
                features = pole_page(offset)
                if len(features) < PAGE and offset + PAGE < EXPECTED_POLES:
                    time.sleep(2)
                    features = pole_page(offset)
                if not features and offset + PAGE < EXPECTED_POLES:
                    raise RuntimeError(f"empty page at offset {offset}")
                append_poles(features, grid, writer)
                handle.flush()
                done.add(offset)
                checkpoint["done_offsets"] = sorted(done)
                checkpoint["complete"] = len(features) < PAGE
                CHECKPOINT.write_text(json.dumps(checkpoint))
                print(f"offset {offset} rows {len(features)} {time.time() - started:.1f}s", flush=True)
                if len(done) % 20 == 0:
                    refresh_coverage(grid_ready=True)
                if len(features) < PAGE:
                    break
            offset += PAGE
        else:
            checkpoint["complete"] = True
            CHECKPOINT.write_text(json.dumps(checkpoint))
    finally:
        handle.close()
        refresh_coverage(grid_ready=True)


def self_check() -> None:
    ring = [(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)]
    assert point_in_ring(0.5, 0.5, ring)
    assert not point_in_ring(1.5, 0.5, ring)
    grid = build_grid(load_districts())
    assert district_of(grid, 77.5946, 12.9716) in ("Bengaluru Urban", "boundary")
    assert district_of(grid, 76.83, 17.33) in ("Kalaburagi", "boundary")
    assert district_of(grid, 70.0, 10.0) == "outside_karnataka"
    print("infrastructure self-check ok")


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else "local"
    if command == "check":
        self_check()
    elif command == "local":
        refresh_coverage()
        print("coverage written", COVERAGE)
    elif command == "poles":
        download_poles()
    else:
        raise SystemExit("use check, local, or poles")


if __name__ == "__main__":
    main()
