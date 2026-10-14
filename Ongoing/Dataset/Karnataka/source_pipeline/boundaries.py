"""Load Karnataka district polygons and point-in-polygon assignment."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from shapely.geometry import Point, shape
from shapely.prepared import prep

from phase2.config import DISTRICTS_GEOJSON


def load_districts(path: Path | None = None) -> list[dict]:
    path = path or DISTRICTS_GEOJSON
    data = json.loads(path.read_text(encoding="utf-8"))
    districts = []
    for feat in data["features"]:
        geom = shape(feat["geometry"])
        if not geom.is_valid:
            geom = geom.buffer(0)
        props = feat["properties"]
        minx, miny, maxx, maxy = geom.bounds  # lon/lat
        districts.append(
            {
                "district_name": props["district_name"],
                "district_code": str(props["district_code"]),
                "geometry": geom,
                "prepared": prep(geom),
                "bbox": (miny, minx, maxy, maxx),  # S,W,N,E
            }
        )
    districts.sort(key=lambda d: d["district_name"])
    return districts


def bbox_of(district: dict) -> tuple[float, float, float, float]:
    return district["bbox"]


def assign_district(lat: float, lon: float, districts: list[dict]) -> dict | None:
    pt = Point(lon, lat)
    # quick bbox filter then prepared contains
    for d in districts:
        s, w, n, e = d["bbox"]
        if not (s <= lat <= n and w <= lon <= e):
            continue
        if d["prepared"].covers(pt):
            return d
    return None


def districts_registry_json(districts: list[dict]) -> dict:
    """Lightweight registry for app consumption (bbox only, no heavy geometry)."""
    areas = {}
    for d in districts:
        s, w, n, e = d["bbox"]
        areas[d["district_name"]] = {
            "district_code": d["district_code"],
            "bbox": [round(s, 6), round(w, 6), round(n, 6), round(e, 6)],
            "state": "Karnataka",
        }
    return {
        "state": "Karnataka",
        "level": "district",
        "count": len(areas),
        "areas": areas,
    }


@lru_cache(maxsize=1)
def cached_districts():
    return load_districts()
