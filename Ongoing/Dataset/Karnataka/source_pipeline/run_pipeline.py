"""
SafeHer Phase 2 orchestrator.

Usage:
  python -m phase2.run_pipeline                 # all districts via Overpass
  python -m phase2.run_pipeline --download-pbf  # also fetch southern-zone PBF
  python -m phase2.run_pipeline Bengaluru Mysuru
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from phase2.cameras import CameraFeedProvider, write_camera_inventory
from phase2.download_sources import download_districts, download_pbf, write_manifest
from phase2.export_dataset import export_all
from phase2.extract_overpass import run_all
from phase2.ingest_official import run as ingest_official


def main(argv: list[str] | None = None):
    p = argparse.ArgumentParser(description="Karnataka Phase-2 dataset pipeline")
    p.add_argument("districts", nargs="*", help="Optional district name filter(s)")
    p.add_argument("--download-pbf", action="store_true", help="Download Geofabrik southern-zone PBF")
    p.add_argument("--skip-extract", action="store_true", help="Only export from existing checkpoints")
    p.add_argument("--export-only", action="store_true", help="Alias for --skip-extract")
    args = p.parse_args(argv)

    print("== Phase 2: download district boundaries ==")
    download_districts()
    write_manifest()

    if args.download_pbf:
        print("== Downloading southern-zone PBF (large) ==")
        download_pbf()

    if not (args.skip_extract or args.export_only):
        print("== Extract + score districts (real OSM via Overpass) ==")
        run_all(args.districts or None)
    else:
        print("== Skipping extract (using checkpoints) ==")

    print("== Ingest public crime + OpenCity CCTV ==")
    print(ingest_official())

    print("== Camera inventory merge ==")
    write_camera_inventory()
    print("Camera feed stub:", CameraFeedProvider().status())

    print("== Export parquet/excel/web JSON ==")
    summary = export_all()
    print("DONE:", summary)


if __name__ == "__main__":
    main()
