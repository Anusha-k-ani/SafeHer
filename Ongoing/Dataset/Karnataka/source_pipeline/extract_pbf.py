"""Optional PBF extract path when southern-zone / karnataka.osm.pbf is present.

Requires: pip install pyosmium
Falls back message if missing — Overpass district pipeline remains primary.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from phase2.config import KARNATAKA_PBF_PATH, PBF_PATH


def available_pbf() -> Path | None:
    for p in (KARNATAKA_PBF_PATH, PBF_PATH):
        if p.exists() and p.stat().st_size > 1_000_000:
            return p
    return None


def extract_hint() -> str:
    p = available_pbf()
    if not p:
        return (
            "No local PBF found. Place Geofabrik southern-zone-latest.osm.pbf at "
            f"{PBF_PATH} or run: python -m phase2.run_pipeline --download-pbf"
        )
    try:
        import osmium  # noqa: F401
    except ImportError:
        return (
            f"PBF present at {p} but pyosmium not installed. "
            "pip install pyosmium  (or continue with Overpass district extract)"
        )
    return f"PBF ready: {p} ({p.stat().st_size/1e6:.1f} MB). Overpass path still used for district scoring in Phase 2."


if __name__ == "__main__":
    print(extract_hint())
