"""Camera layer: merge OSM cameras + optional official Safe City / police CSV."""
from __future__ import annotations

import csv
import json
import math
from pathlib import Path

from phase2.config import OFFICIAL_CCTV_CSV, OFFICIAL_CCTV_GEOJSON, PROCESSED


def haversine(lat1, lon1, lat2, lon2):
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def load_osm_cameras() -> list[dict]:
    cams = []
    for path in PROCESSED.glob("cameras_*.json"):
        if path.name == "cameras_karnataka.json":
            continue  # merged inventory, not a district extract
        data = json.loads(path.read_text(encoding="utf-8"))
        cams.extend(data.get("cameras") or [])
    return cams


def load_official_cameras() -> list[dict]:
    out = []
    if OFFICIAL_CCTV_CSV.exists():
        with open(OFFICIAL_CCTV_CSV, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                try:
                    lat = float(row.get("lat") or row.get("latitude"))
                    lon = float(row.get("lon") or row.get("longitude") or row.get("lng"))
                except (TypeError, ValueError):
                    continue
                out.append(
                    {
                        "camera_id": f"official_{row.get('id') or len(out)}",
                        "osm_id": None,
                        "osm_type": None,
                        "latitude": lat,
                        "longitude": lon,
                        "district_name": row.get("district") or row.get("district_name") or "",
                        "district_code": row.get("district_code") or "",
                        "source": (row.get("source") or "official").strip() or "official",
                        "tags": {
                            "type": row.get("type") or row.get("camera_type") or "",
                            "jurisdiction": row.get("jurisdiction") or "",
                        },
                        "as_of": row.get("as_of") or "",
                    }
                )
    if OFFICIAL_CCTV_GEOJSON.exists():
        gj = json.loads(OFFICIAL_CCTV_GEOJSON.read_text(encoding="utf-8"))
        for i, feat in enumerate(gj.get("features") or []):
            geom = feat.get("geometry") or {}
            if geom.get("type") != "Point":
                continue
            lon, lat = geom["coordinates"][:2]
            props = feat.get("properties") or {}
            out.append(
                {
                    "camera_id": f"official_geo_{props.get('id', i)}",
                    "osm_id": None,
                    "osm_type": None,
                    "latitude": lat,
                    "longitude": lon,
                    "district_name": props.get("district_name") or "",
                    "district_code": str(props.get("district_code") or ""),
                    "source": "official",
                    "tags": props,
                    "as_of": props.get("as_of") or "",
                }
            )
    return out


def merge_cameras(dedupe_m: float = 25.0) -> list[dict]:
    """Merge OSM + official/opencity; drop near-duplicates keeping non-OSM over OSM."""
    official = load_official_cameras()
    osm = load_osm_cameras()
    merged: list[dict] = []
    for cam in official:
        merged.append(cam)
    for cam in osm:
        dup = False
        for o in official:
            if haversine(cam["latitude"], cam["longitude"], o["latitude"], o["longitude"]) <= dedupe_m:
                dup = True
                break
        if not dup:
            merged.append(cam)
    return merged


def write_camera_inventory(path: Path | None = None) -> Path:
    path = path or (PROCESSED / "cameras_karnataka.json")
    cams = merge_cameras()
    payload = {
        "count": len(cams),
        "sources": sorted({c["source"] for c in cams}),
        "note": (
            "Layer A = OSM surveillance nodes. Layer B = optional official CSV/GeoJSON "
            "placed at phase2/data/raw/official_cctv.csv|geojson. "
            "Globe visualization via God's Eye View catalog export "
            "(phase2/export_godseye.py → bilawalsidhu/gods-eye-view). "
            "Live police FRS / Safe City streams require MoU (not included)."
        ),
        "cameras": cams,
    }
    path.write_text(json.dumps(payload), encoding="utf-8")
    print(f"Camera inventory: {len(cams)} -> {path}")
    return path


class CameraFeedProvider:
    """Stub for future official live feed / FRS integration."""

    def __init__(self, endpoint: str | None = None, api_key: str | None = None):
        self.endpoint = endpoint
        self.api_key = api_key

    def list_feeds(self) -> list[dict]:
        if not self.endpoint:
            return []
        raise NotImplementedError(
            "Live camera feeds require an official police/Safe City API (MoU)."
        )

    def status(self) -> dict:
        return {
            "configured": bool(self.endpoint),
            "live": False,
            "message": "Inventory-only mode. Provide MoU endpoint for live streams.",
        }


if __name__ == "__main__":
    write_camera_inventory()
