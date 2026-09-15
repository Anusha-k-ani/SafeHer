"""Paths and constants for Karnataka Phase-2 pipeline."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(r"c:\aman\dataset for pbl")
PHASE2 = ROOT / "phase2"
DATA = PHASE2 / "data"
RAW = DATA / "raw"
PROCESSED = DATA / "processed"
EXPORTS = DATA / "exports"
CHECKPOINTS = PHASE2 / "checkpoints"
DOCS = PHASE2 / "docs"

for d in (RAW, PROCESSED, EXPORTS, CHECKPOINTS, DOCS):
    d.mkdir(parents=True, exist_ok=True)

# Geofabrik southern zone includes Karnataka (+ neighbours). Prefer local PBF if present.
SOUTHERN_ZONE_PBF_URL = (
    "https://download.geofabrik.de/asia/india/southern-zone-latest.osm.pbf"
)
PBF_PATH = RAW / "southern-zone-latest.osm.pbf"
KARNATAKA_PBF_PATH = RAW / "karnataka.osm.pbf"

# Karnataka district polygons (civic open GeoJSON)
DISTRICTS_GEOJSON_URL = (
    "https://raw.githubusercontent.com/civictech-India/DataSetsJson/main/"
    "Karnataka_District_Boundary.json"
)
DISTRICTS_GEOJSON_FALLBACK_URL = (
    "https://raw.githubusercontent.com/inosaint/StatesOfIndia/master/karnataka.geojson"
)
DISTRICTS_GEOJSON = RAW / "karnataka_districts.geojson"
DISTRICTS_ALL_GEOJSON = RAW / "karnataka_districts_source.json"

# Optional official CCTV inventory (user-supplied)
OFFICIAL_CCTV_CSV = RAW / "official_cctv.csv"
OFFICIAL_CCTV_GEOJSON = RAW / "official_cctv.geojson"

OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
USER_AGENT = "SafeHerPhase2/2.0 (academic; Karnataka street safety research)"

HIGHWAY_TYPES = {
    "primary",
    "secondary",
    "tertiary",
    "residential",
    "unclassified",
    "trunk",
    "living_street",
    "pedestrian",
    "service",  # flagged in output
}

WEIGHTS = {
    "police": 0.20,
    "hospital": 0.15,
    "lighting": 0.15,
    "bus": 0.15,
    "proxy_crowd": 0.10,
    "cctv": 0.10,
    "road": 0.05,
    "proxy_night": 0.05,
    "proxy_commercial": 0.05,
}

DATA_SOURCE_OSM = "OpenStreetMap"
AS_OF_PLACEHOLDER = None  # filled at run time
