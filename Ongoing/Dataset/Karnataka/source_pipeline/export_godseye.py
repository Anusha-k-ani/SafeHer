"""Export SafeHer Karnataka camera inventory as God's Eye View CCTV sources.

Uses https://github.com/bilawalsidhu/gods-eye-view CCTV catalog schema so the
public OSINT globe can plot OSM (and optional official) camera positions.

This is inventory + estimated viewshed priors only — not live police streams,
FRS, or person tracking. GEV will show synthetic/Street View fallbacks when
no public stream URL exists.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

from phase2.cameras import merge_cameras
from phase2.config import EXPORTS, ROOT

# GEV default hard cap (server/providers/cctv/constants.js DEFAULT_CCTV_MAX_SOURCES)
GEV_MAX_SOURCES = 900

# Prefer dense / urban districts first when capping for the globe
DISTRICT_PRIORITY = [
    "Bengaluru Urban",
    "Bengaluru Rural",
    "Mysuru",
    "Mangaluru",  # alias if present
    "Dakshina Kannada",
    "Belagavi",
    "Hubballi",  # alias if present
    "Dharwad",
    "Kalaburagi",
    "Ballari",
    "Tumakuru",
    "Ramanagara",
    "Mandya",
    "Hassan",
]

BENGALURU_CENTER = (12.9716, 77.5946)


def _dist_km(lat: float, lon: float, lat0: float, lon0: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat), math.radians(lat0)
    dp = math.radians(lat0 - lat)
    dl = math.radians(lon0 - lon)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def camera_to_gev(cam: dict) -> dict | None:
    try:
        lat = float(cam["latitude"])
        lon = float(cam["longitude"])
    except (KeyError, TypeError, ValueError):
        return None
    if not (math.isfinite(lat) and math.isfinite(lon)):
        return None
    cid = str(cam.get("camera_id") or f"ka_{cam.get('osm_id')}")
    district = cam.get("district_name") or "Karnataka"
    source = cam.get("source") or "osm"
    return {
        "id": cid,
        "name": f"{district} · {cid}",
        "city": district,
        "cityId": "karnataka",
        "provider": (
            "SafeHer official CCTV inventory"
            if source == "official"
            else "SafeHer OSM surveillance inventory (Karnataka)"
        ),
        "sourceKind": "safeher_official" if source == "official" else "safeher_osm",
        "feedType": "image",
        "url": "",  # no public stream — GEV uses synthetic / Street View fallback
        "snapshotUrl": "",
        "lat": round(lat, 7),
        "lon": round(lon, 7),
        "headingDeg": 0,
        "pitchDeg": -15,
        "fovDeg": 70,
        "rangeM": 250,
        "mountHeightM": 8,
        "headingConfidence": "prior",
        "poseSource": "curated" if source == "official" else None,
        "license": (
            "User-supplied official inventory"
            if source == "official"
            else "OpenStreetMap contributors (ODbL) — man_made=surveillance tags"
        ),
    }


def select_for_gev(cams: list[dict], limit: int = GEV_MAX_SOURCES) -> list[dict]:
    """Rank by district priority, then distance to Bengaluru (stable, auditable)."""
    prio = {name: i for i, name in enumerate(DISTRICT_PRIORITY)}

    def key(c: dict):
        dname = c.get("district_name") or ""
        try:
            lat, lon = float(c["latitude"]), float(c["longitude"])
        except (KeyError, TypeError, ValueError):
            return (999, 1e9, c.get("camera_id") or "")
        return (
            prio.get(dname, 100),
            _dist_km(lat, lon, *BENGALURU_CENTER),
            c.get("camera_id") or "",
        )

    ranked = sorted(cams, key=key)
    out = []
    for cam in ranked:
        item = camera_to_gev(cam)
        if item:
            # drop None poseSource for cleaner JSON
            if item.get("poseSource") is None:
                item.pop("poseSource", None)
            out.append(item)
        if len(out) >= limit:
            break
    return out


def export_godseye_cctv(limit: int = GEV_MAX_SOURCES) -> dict:
    cams = merge_cameras()
    pack = select_for_gev(cams, limit=limit)
    EXPORTS.mkdir(parents=True, exist_ok=True)
    out_exports = EXPORTS / "godseye_cctv_sources.json"
    out_exports.write_text(json.dumps(pack, indent=2), encoding="utf-8")

    web_out = ROOT / "web" / "public" / "data" / "karnataka" / "godseye_cctv_sources.json"
    web_out.parent.mkdir(parents=True, exist_ok=True)
    web_out.write_text(json.dumps(pack), encoding="utf-8")

    vendor_cfg = ROOT / "_vendor" / "gods-eye-view" / "config" / "cctv_sources.karnataka.json"
    if vendor_cfg.parent.exists():
        vendor_cfg.write_text(json.dumps(pack, indent=2), encoding="utf-8")

    meta = {
        "format": "gods-eye-view CCTV sources",
        "upstream": "https://github.com/bilawalsidhu/gods-eye-view",
        "total_inventory": len(cams),
        "exported": len(pack),
        "cap": limit,
        "note": (
            "Inventory markers for public globe visualization. "
            "Not live police feeds / FRS. Full inventory remains in cameras_karnataka.json."
        ),
        "paths": {
            "exports": str(out_exports),
            "web": str(web_out),
            "vendor_config": str(vendor_cfg) if vendor_cfg.exists() else None,
        },
    }
    (EXPORTS / "godseye_export_meta.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )
    print(
        f"God's Eye CCTV pack: {len(pack)}/{len(cams)} -> {out_exports}",
        flush=True,
    )
    return meta


def _self_check():
    sample = {
        "camera_id": "osm_node_1",
        "latitude": 12.97,
        "longitude": 77.59,
        "district_name": "Bengaluru Urban",
        "source": "osm",
    }
    item = camera_to_gev(sample)
    assert item and item["id"] == "osm_node_1"
    assert abs(item["lat"] - 12.97) < 1e-6
    ranked = select_for_gev([sample], limit=1)
    assert len(ranked) == 1
    print("export_godseye self-check OK", flush=True)


if __name__ == "__main__":
    _self_check()
    export_godseye_cctv()
