"""Fetch real OSM streets + POIs per Karnataka district via Overpass (resume-safe).

Uses scipy KDTree for nearest/count queries (required at statewide scale).
Excludes highway=service by default (optional via INCLUDE_SERVICE).
"""
from __future__ import annotations

import json
import math
import os
import time
from datetime import datetime, timezone

import numpy as np
import requests
from scipy.spatial import cKDTree

from phase2.boundaries import bbox_of, load_districts
from phase2.config import CHECKPOINTS, OVERPASS_URLS, PROCESSED, USER_AGENT
from phase2.scoring_v2 import compute_row_scores

from shapely.geometry import Point

SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT})

INCLUDE_SERVICE = os.environ.get("INCLUDE_SERVICE", "0") == "1"
HIGHWAY_RE = (
    "primary|secondary|tertiary|residential|unclassified|trunk|living_street|pedestrian"
    + ("|service" if INCLUDE_SERVICE else "")
)


def earth_tree(points: list[dict]):
    """Build KDTree in ECEF-ish radians for approx metre distances via * R."""
    if not points:
        return None, None
    lats = np.array([p["lat"] for p in points], dtype=float)
    lons = np.array([p["lon"] for p in points], dtype=float)
    # equirectangular metres around mean lat
    lat0 = math.radians(float(np.mean(lats)))
    xs = np.radians(lons) * math.cos(lat0) * 6371000.0
    ys = np.radians(lats) * 6371000.0
    coords = np.column_stack([xs, ys])
    return cKDTree(coords), (lat0, coords)


def to_xy(lat: float, lon: float, lat0: float):
    x = math.radians(lon) * math.cos(lat0) * 6371000.0
    y = math.radians(lat) * 6371000.0
    return x, y


def nearest_m(tree, lat0, lat, lon):
    if tree is None:
        return None
    x, y = to_xy(lat, lon, lat0)
    d, _ = tree.query([x, y], k=1)
    return float(d)


def count_radius(tree, lat0, lat, lon, radius):
    if tree is None:
        return 0
    x, y = to_xy(lat, lon, lat0)
    return len(tree.query_ball_point([x, y], r=radius))


def expand_bbox(bbox, km=5.0):
    s, w, n, e = bbox
    dlat = km / 111.0
    dlon = km / (111.0 * max(0.2, math.cos(math.radians((s + n) / 2))))
    return (s - dlat, w - dlon, n + dlat, e + dlon)


def overpass(query: str, retries: int = 6, timeout: int = 180):
    """Try mirrors in round-robin; rotate immediately on 429/5xx."""
    last_err = None
    n = len(OVERPASS_URLS)
    for attempt in range(retries * n):
        url = OVERPASS_URLS[attempt % n]
        host = url.split("//")[1].split("/")[0]
        try:
            print(f"  overpass {host} try={attempt + 1}", flush=True)
            resp = SESSION.post(url, data={"data": query}, timeout=timeout)
            if resp.status_code == 200:
                return resp.json()
            print(f"  overpass HTTP {resp.status_code}", flush=True)
            time.sleep(8 if resp.status_code in (429, 502, 504) else 4)
        except Exception as e:
            last_err = e
            print(f"  overpass err: {e}", flush=True)
            time.sleep(6)
    print(f"  Overpass failed: {last_err}", flush=True)
    return None


def centroid(el):
    if el.get("type") == "node":
        return el.get("lat"), el.get("lon")
    if "center" in el:
        return el["center"]["lat"], el["center"]["lon"]
    if "geometry" in el and el["geometry"]:
        lats = [p["lat"] for p in el["geometry"]]
        lons = [p["lon"] for p in el["geometry"]]
        return sum(lats) / len(lats), sum(lons) / len(lons)
    return None, None


def fetch_streets(bbox):
    s, w, n, e = bbox
    q = f"""
[out:json][timeout:180];
(
  way["highway"~"^({HIGHWAY_RE})$"]({s},{w},{n},{e});
);
out center tags;
"""
    data = overpass(q, timeout=200)
    if not data:
        return []
    out = []
    for el in data.get("elements", []):
        tags = el.get("tags") or {}
        hw = tags.get("highway", "")
        lat, lon = centroid(el)
        if lat is None:
            continue
        out.append(
            {
                "osm_way_id": el["id"],
                "name": tags.get("name") or tags.get("ref") or f"way/{el['id']}",
                "lat": lat,
                "lon": lon,
                "highway": hw,
                "surface": tags.get("surface") or "",
                "lit": tags.get("lit") or "",
                "service_flagged": hw == "service",
            }
        )
    return out


def _classify_poi(tags: dict) -> str | None:
    if tags.get("highway") == "bus_stop" or tags.get("public_transport") == "stop_position":
        return "bus"
    if tags.get("amenity") == "police":
        return "police"
    if tags.get("amenity") in ("hospital", "clinic", "doctors"):
        return "hospital"
    if (
        tags.get("man_made") == "surveillance"
        or tags.get("surveillance:type") == "camera"
        or "camera:type" in tags
    ):
        return "cctv"
    if tags.get("highway") == "street_lamp":
        return "lamp"
    return None


def fetch_all_pois(bbox) -> dict[str, list]:
    """One Overpass round-trip for all scoring POIs (much faster than 5 separate calls)."""
    s, w, n, e = bbox
    q = f"""
[out:json][timeout:180];
(
  node["highway"="bus_stop"]({s},{w},{n},{e});
  node["public_transport"="stop_position"]({s},{w},{n},{e});
  node["amenity"="police"]({s},{w},{n},{e});
  way["amenity"="police"]({s},{w},{n},{e});
  node["amenity"~"^(hospital|clinic|doctors)$"]({s},{w},{n},{e});
  way["amenity"~"^(hospital|clinic|doctors)$"]({s},{w},{n},{e});
  node["man_made"="surveillance"]({s},{w},{n},{e});
  node["surveillance:type"="camera"]({s},{w},{n},{e});
  node["camera:type"]({s},{w},{n},{e});
  node["highway"="street_lamp"]({s},{w},{n},{e});
);
out center tags;
"""
    print("  fetching POIs (combined)...", flush=True)
    data = overpass(q, timeout=200)
    buckets: dict[str, list] = {
        "bus": [],
        "police": [],
        "hospital": [],
        "cctv": [],
        "lamp": [],
    }
    if not data:
        return buckets
    for el in data.get("elements", []):
        tags = el.get("tags") or {}
        kind = _classify_poi(tags)
        if not kind:
            continue
        lat, lon = centroid(el)
        if lat is None:
            continue
        buckets[kind].append(
            {
                "osm_id": el["id"],
                "osm_type": el.get("type", "node"),
                "lat": lat,
                "lon": lon,
                "tags": tags,
                "kind": kind,
            }
        )
    return buckets


def process_district(district: dict, as_of: str) -> dict:
    name = district["district_name"]
    code = district["district_code"]
    ck = CHECKPOINTS / f"{_slug(name)}.json"
    if ck.exists():
        print(f"  checkpoint hit: {name}", flush=True)
        return json.loads(ck.read_text(encoding="utf-8"))

    bbox = bbox_of(district)
    print(f"\n=== {name} bbox={bbox} ===", flush=True)
    print("  fetching streets...", flush=True)
    streets = fetch_streets(bbox)
    # Keep only centroids inside the district polygon (bbox can spill into neighbours)
    prepared = district["prepared"]
    before = len(streets)
    streets = [
        st for st in streets if prepared.covers(Point(st["lon"], st["lat"]))
    ]
    print(f"  streets: {len(streets)} (clipped from {before} in bbox)", flush=True)
    if before == 0:
        raise RuntimeError(f"Overpass returned 0 streets for {name} — not checkpointing")
    time.sleep(1.0)
    # 2 km buffer — enough for nearest-police/hospital without huge Overpass bboxes
    exp = expand_bbox(bbox, 2.0)
    pois = fetch_all_pois(exp)
    bus, police, hospital, cctv, lamps = (
        pois["bus"],
        pois["police"],
        pois["hospital"],
        pois["cctv"],
        pois["lamp"],
    )
    # Cameras attributed to this district must lie inside the polygon
    cctv_in = [c for c in cctv if prepared.covers(Point(c["lon"], c["lat"]))]
    print(
        f"  POIs bus={len(bus)} police={len(police)} hospital={len(hospital)} "
        f"cctv={len(cctv_in)}/{len(cctv)} lamps={len(lamps)}",
        flush=True,
    )

    bus_t, bus_m = earth_tree(bus)
    pol_t, pol_m = earth_tree(police)
    hos_t, hos_m = earth_tree(hospital)
    cam_t, cam_m = earth_tree(cctv)  # use buffered cameras for coverage metrics
    lamp_t, lamp_m = earth_tree(lamps)

    rows = []
    for i, st in enumerate(streets):
        lat, lon = st["lat"], st["lon"]
        bus_c = count_radius(bus_t, bus_m[0], lat, lon, 500) if bus_m else 0
        pol_d = nearest_m(pol_t, pol_m[0], lat, lon) if pol_m else None
        hos_d = nearest_m(hos_t, hos_m[0], lat, lon) if hos_m else None
        c100 = count_radius(cam_t, cam_m[0], lat, lon, 100) if cam_m else 0
        c250 = count_radius(cam_t, cam_m[0], lat, lon, 250) if cam_m else 0
        c500 = count_radius(cam_t, cam_m[0], lat, lon, 500) if cam_m else 0
        near_cam = nearest_m(cam_t, cam_m[0], lat, lon) if cam_m else None
        lamp_c = count_radius(lamp_t, lamp_m[0], lat, lon, 300) if lamp_m else 0
        has_cctv = bool(c100 or c250 or (near_cam is not None and near_cam <= 300))
        base = {
            "highway": st["highway"],
            "surface": st["surface"],
            "lit": st["lit"],
            "bus_count": bus_c,
            "police_dist_m": pol_d if pol_d is not None else 5000.0,
            "hospital_dist_m": hos_d if hos_d is not None else 5000.0,
            "has_cctv": has_cctv,
            "lamp_count": lamp_c,
            "cctv_within_100m": c100,
            "cctv_within_250m": c250,
            "cctv_within_500m": c500,
            "nearest_camera_m": near_cam,
        }
        scored = compute_row_scores(base)
        rows.append(
            {
                "street_id": f"KA_{code}_{st['osm_way_id']}",
                "osm_way_id": st["osm_way_id"],
                "street_name": st["name"],
                "district_name": name,
                "district_code": code,
                "state": "Karnataka",
                "latitude": round(lat, 7),
                "longitude": round(lon, 7),
                "highway": st["highway"],
                "surface": st["surface"] or None,
                "lit": st["lit"] or None,
                "service_flagged": st["service_flagged"],
                "bus_stop_count": bus_c,
                "police_distance_m": None if pol_d is None else round(pol_d, 1),
                "hospital_distance_m": None if hos_d is None else round(hos_d, 1),
                "lamp_count_300m": lamp_c,
                "cctv_within_100m": c100,
                "cctv_within_250m": c250,
                "cctv_within_500m": c500,
                "nearest_camera_m": None if near_cam is None else round(near_cam, 1),
                "camera_sources": "osm",
                "data_source": "OpenStreetMap via Overpass",
                "as_of": as_of,
                **scored,
            }
        )
        if (i + 1) % 25000 == 0:
            print(f"  scored {i+1}/{len(streets)}", flush=True)

    cameras = [
        {
            "camera_id": f"osm_{c['osm_type']}_{c['osm_id']}",
            "osm_id": c["osm_id"],
            "osm_type": c["osm_type"],
            "latitude": c["lat"],
            "longitude": c["lon"],
            "district_name": name,
            "district_code": code,
            "source": "osm",
            "tags": c.get("tags") or {},
            "as_of": as_of,
        }
        for c in cctv_in
    ]

    result = {
        "district_name": name,
        "district_code": code,
        "street_count": len(rows),
        "camera_count": len(cameras),
        "streets": rows,
        "cameras": cameras,
        "as_of": as_of,
    }
    # checkpoints can be huge — store streets/cameras separately, tiny checkpoint meta
    (PROCESSED / f"streets_{_slug(name)}.json").write_text(
        json.dumps({"streets": rows, "meta": {"district": name, "as_of": as_of}}),
        encoding="utf-8",
    )
    (PROCESSED / f"cameras_{_slug(name)}.json").write_text(
        json.dumps({"cameras": cameras, "meta": {"district": name, "as_of": as_of}}),
        encoding="utf-8",
    )
    meta = {
        "district_name": name,
        "district_code": code,
        "street_count": len(rows),
        "camera_count": len(cameras),
        "as_of": as_of,
        "done": True,
    }
    ck.write_text(json.dumps(meta), encoding="utf-8")
    print(f"  saved {len(rows)} streets, {len(cameras)} cameras", flush=True)
    return result


def _slug(name: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in name.lower()).strip("_")


def run_all(district_filter: list[str] | None = None):
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    districts = load_districts()
    if district_filter:
        want = {d.lower() for d in district_filter}
        districts = [d for d in districts if d["district_name"].lower() in want]
    print(f"Processing {len(districts)} districts, as_of={as_of}", flush=True)
    summary = []
    for d in districts:
        try:
            res = process_district(d, as_of)
            summary.append(
                {
                    "district_name": res["district_name"],
                    "streets": res["street_count"],
                    "cameras": res["camera_count"],
                }
            )
        except Exception as e:
            print(f"  ERROR {d['district_name']}: {e}", flush=True)
            summary.append(
                {"district_name": d["district_name"], "streets": 0, "cameras": 0, "error": str(e)}
            )
        time.sleep(1.5)
    out = CHECKPOINTS / "_summary.json"
    out.write_text(json.dumps({"as_of": as_of, "districts": summary}, indent=2), encoding="utf-8")
    print(f"Summary -> {out}", flush=True)
    return summary


if __name__ == "__main__":
    import sys

    filt = sys.argv[1:] or None
    run_all(filt)
