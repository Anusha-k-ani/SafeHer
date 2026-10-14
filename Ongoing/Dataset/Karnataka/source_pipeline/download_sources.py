"""Download Karnataka district boundaries and (optional) OSM PBF."""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from phase2.config import (
    DISTRICTS_ALL_GEOJSON,
    DISTRICTS_GEOJSON,
    DISTRICTS_GEOJSON_FALLBACK_URL,
    DISTRICTS_GEOJSON_URL,
    PBF_PATH,
    RAW,
    SOUTHERN_ZONE_PBF_URL,
    USER_AGENT,
)

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def _download(url: str, dest: Path, *, resume: bool = True) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    print(f"Downloading {url}")
    print(f"  -> {dest}")
    with urllib.request.urlopen(req, timeout=120) as resp:
        total = resp.headers.get("Content-Length")
        total_n = int(total) if total else None
        tmp = dest.with_suffix(dest.suffix + ".part")
        mode = "ab" if resume and tmp.exists() else "wb"
        done = tmp.stat().st_size if mode == "ab" else 0
        if resume and done and total_n and done >= total_n:
            tmp.replace(dest)
            return dest
        # simple full download (resume for huge PBF handled below)
        if dest.suffix == ".pbf" and resume and done > 0 and total_n:
            # restart with Range
            req2 = urllib.request.Request(
                url,
                headers={"User-Agent": USER_AGENT, "Range": f"bytes={done}-"},
            )
            try:
                resp = urllib.request.urlopen(req2, timeout=120)
            except Exception:
                done = 0
                mode = "wb"
        written = done
        with open(tmp, mode) as f:
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                written += len(chunk)
                if total_n:
                    pct = 100.0 * written / total_n
                    print(f"\r  {written/1e6:.1f}/{total_n/1e6:.1f} MB ({pct:.1f}%)", end="")
                else:
                    print(f"\r  {written/1e6:.1f} MB", end="")
        print()
        tmp.replace(dest)
    return dest


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _district_name(props: dict) -> str:
    for key in (
        "DISTRICT",
        "District",
        "district",
        "NAME_2",
        "name",
        "NAME",
        "dtname",
        "DIST_NAME",
        "district_name",
    ):
        if props.get(key):
            return str(props[key]).strip()
    return "Unknown"


def download_districts() -> Path:
    """Fetch Karnataka district GeoJSON (civictech, fallback inosaint)."""
    source_url = DISTRICTS_GEOJSON_URL
    if not DISTRICTS_ALL_GEOJSON.exists():
        try:
            _download(DISTRICTS_GEOJSON_URL, DISTRICTS_ALL_GEOJSON, resume=False)
        except Exception as e:
            print(f"Primary districts URL failed ({e}); trying fallback...")
            source_url = DISTRICTS_GEOJSON_FALLBACK_URL
            _download(DISTRICTS_GEOJSON_FALLBACK_URL, DISTRICTS_ALL_GEOJSON, resume=False)
    with open(DISTRICTS_ALL_GEOJSON, encoding="utf-8") as f:
        data = json.load(f)

    features = []
    for feat in data.get("features", []):
        props = feat.get("properties") or {}
        # Already Karnataka-only files, or filter by state if present
        st = (
            props.get("ST_NM")
            or props.get("ST_NAME")
            or props.get("NAME_1")
            or props.get("state")
            or props.get("STATE")
            or "Karnataka"
        )
        if str(st).strip().lower() not in {"karnataka", "ka", ""}:
            continue
        name_n = _district_name(props)
        if name_n.lower() in {"karnataka", "unknown"}:
            continue
        # normalize common spellings
        aliases = {
            "bangalore": "Bengaluru Urban",
            "bangalore urban": "Bengaluru Urban",
            "bengaluru": "Bengaluru Urban",
            "bangalore rural": "Bengaluru Rural",
            "bagalkot": "Bagalkote",
            "belgaum": "Belagavi",
            "bellary": "Ballari",
            "bijapur": "Vijayapura",
            "gulbarga": "Kalaburagi",
            "mysore": "Mysuru",
            "mangalore": "Dakshina Kannada",
            "shimoga": "Shivamogga",
            "tumkur": "Tumakuru",
        }
        name_key = name_n.lower()
        name_n = aliases.get(name_key, name_n)
        features.append(
            {
                "type": "Feature",
                "properties": {
                    "district_name": name_n,
                    "district_code": str(
                        props.get("censuscode")
                        or props.get("DISTRICT_C")
                        or props.get("dt_code")
                        or props.get("ID_2")
                        or name_n
                    ),
                    "state": "Karnataka",
                    "source": "civictech-India / StatesOfIndia GeoJSON",
                    "source_url": source_url,
                },
                "geometry": feat["geometry"],
            }
        )

    out = {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "as_of": datetime.now(timezone.utc).isoformat(),
            "source": source_url,
            "feature_count": len(features),
        },
    }
    DISTRICTS_GEOJSON.write_text(json.dumps(out), encoding="utf-8")
    print(f"Wrote {len(features)} Karnataka districts -> {DISTRICTS_GEOJSON}")
    return DISTRICTS_GEOJSON


def download_pbf(*, force: bool = False) -> Path | None:
    """Download Geofabrik southern-zone PBF (includes Karnataka). Large ~530MB."""
    if PBF_PATH.exists() and not force:
        print(f"PBF already present: {PBF_PATH} ({PBF_PATH.stat().st_size/1e6:.1f} MB)")
        return PBF_PATH
    try:
        _download(SOUTHERN_ZONE_PBF_URL, PBF_PATH, resume=True)
        digest = sha256_file(PBF_PATH)
        (RAW / "southern-zone-latest.osm.pbf.sha256").write_text(
            f"{digest}  southern-zone-latest.osm.pbf\n", encoding="utf-8"
        )
        print(f"SHA256 {digest}")
        return PBF_PATH
    except Exception as e:
        print(f"PBF download failed: {e}")
        print("Pipeline will fall back to Overpass per-district (still real OSM data).")
        return None


def write_manifest(extra: dict | None = None) -> Path:
    man = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "districts_geojson": str(DISTRICTS_GEOJSON),
        "districts_exists": DISTRICTS_GEOJSON.exists(),
        "pbf": str(PBF_PATH),
        "pbf_exists": PBF_PATH.exists(),
        "pbf_sha256": (
            sha256_file(PBF_PATH) if PBF_PATH.exists() else None
        ),
    }
    if extra:
        man.update(extra)
    path = RAW / "download_manifest.json"
    path.write_text(json.dumps(man, indent=2), encoding="utf-8")
    return path


def main():
    download_districts()
    write_manifest()
    print("Done. Use --download-pbf via run_pipeline for Geofabrik southern-zone PBF.")


if __name__ == "__main__":
    main()
