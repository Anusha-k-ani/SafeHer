"""Export Karnataka streets/cameras to Parquet, Excel (per district), chunked web JSON."""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from shapely.geometry import Point

from phase2.boundaries import districts_registry_json, load_districts
from phase2.cameras import write_camera_inventory
from phase2.config import CHECKPOINTS, EXPORTS, PROCESSED, RAW, ROOT
from phase2.export_godseye import export_godseye_cctv


def _district_lookup():
    return {d["district_name"]: d for d in load_districts()}


def attach_crime_overlay(df: pd.DataFrame) -> pd.DataFrame:
    """Join district/commissionerate KSP aggregates (OpenCity). Not street incidents."""
    path = RAW / "official" / "district_crime_overlay.json"
    if not path.exists() or df.empty:
        return df
    overlay = json.loads(path.read_text(encoding="utf-8")).get("districts") or {}
    if not overlay:
        return df
    crime_df = pd.DataFrame(list(overlay.values()))
    keep = [
        c
        for c in crime_df.columns
        if c.startswith(
            (
                "ipc_",
                "sll_",
                "total_",
                "assault_",
                "sexual_",
                "murder_",
                "rape_",
                "robbery_",
                "theft_",
                "crime_",
            )
        )
        or c == "district_name"
    ]
    crime_df = crime_df[keep]
    out = df.merge(crime_df, on="district_name", how="left")
    print(
        f"Crime overlay joined: {out['crime_grain'].notna().sum() if 'crime_grain' in out.columns else 0} streets",
        flush=True,
    )
    return out


def clip_street_rows(streets: list[dict]) -> list[dict]:
    """Drop rows whose centroid is outside the named district polygon."""
    lookup = _district_lookup()
    kept = []
    dropped = 0
    for row in streets:
        d = lookup.get(row.get("district_name"))
        if not d:
            dropped += 1
            continue
        if d["prepared"].covers(Point(row["longitude"], row["latitude"])):
            kept.append(row)
        else:
            dropped += 1
    if dropped:
        print(f"Polygon clip: kept {len(kept)}, dropped {dropped} out-of-district centroids")
    return kept


def load_all_streets() -> list[dict]:
    streets = []
    for path in sorted(PROCESSED.glob("streets_*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        streets.extend(data.get("streets") or [])
    return clip_street_rows(streets)


def export_all():
    as_of = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    streets = load_all_streets()
    if not streets:
        # try assembling from checkpoints
        for path in CHECKPOINTS.glob("*.json"):
            if path.name.startswith("_"):
                continue
            data = json.loads(path.read_text(encoding="utf-8"))
            streets.extend(data.get("streets") or [])

    print(f"Loaded {len(streets)} streets")
    cams_path = write_camera_inventory()
    cams = json.loads(cams_path.read_text(encoding="utf-8")).get("cameras") or []

    df = pd.DataFrame(streets)
    if df.empty:
        raise SystemExit("No street rows to export — run extract first.")

    df = attach_crime_overlay(df)
    # Statewide parquet
    pq = EXPORTS / "karnataka_streets.parquet"
    df.to_parquet(pq, index=False)
    print(f"Parquet -> {pq}")

    cam_df = pd.DataFrame(cams)
    cam_pq = EXPORTS / "karnataka_cameras.parquet"
    if not cam_df.empty:
        # tags dict -> json string for parquet
        if "tags" in cam_df.columns:
            cam_df["tags"] = cam_df["tags"].apply(
                lambda x: json.dumps(x) if isinstance(x, dict) else x
            )
        cam_df.to_parquet(cam_pq, index=False)
        print(f"Cameras parquet -> {cam_pq}")

    # Per-district Excel
    by_dist = defaultdict(list)
    for row in streets:
        by_dist[row["district_name"]].append(row)

    excel_dir = EXPORTS / "by_district"
    excel_dir.mkdir(parents=True, exist_ok=True)
    for dist, rows in sorted(by_dist.items()):
        safe = "".join(c if c.isalnum() else "_" for c in dist)
        path = excel_dir / f"{safe}.xlsx"
        dfd = pd.DataFrame(rows)
        summary = (
            dfd.groupby("safety_level").size().rename("count").reset_index()
            if "safety_level" in dfd.columns
            else pd.DataFrame()
        )
        with pd.ExcelWriter(path, engine="openpyxl") as xw:
            dfd.to_excel(xw, sheet_name="Streets", index=False)
            if not summary.empty:
                summary.to_excel(xw, sheet_name="Safety Distribution", index=False)
            meta = pd.DataFrame(
                [
                    {"Metric": "district", "Value": dist},
                    {"Metric": "street_count", "Value": len(rows)},
                    {"Metric": "as_of", "Value": rows[0].get("as_of", as_of)},
                    {"Metric": "data_source", "Value": "OpenStreetMap"},
                    {
                        "Metric": "note",
                        "Value": "infra_safety_score is infrastructure proxy, not crime rate",
                    },
                ]
            )
            meta.to_excel(xw, sheet_name="Summary", index=False)
        print(f"  Excel {path.name}: {len(rows)} streets")

    # Statewide workbook (may be large — write summary + sample if huge)
    state_xlsx = EXPORTS / "karnataka_street_safety.xlsx"
    with pd.ExcelWriter(state_xlsx, engine="openpyxl") as xw:
        if len(df) <= 200_000:
            df.to_excel(xw, sheet_name="Street Safety Dataset", index=False)
        else:
            df.head(50_000).to_excel(xw, sheet_name="Street Safety Sample50k", index=False)
        dist_sum = (
            df.groupby(["district_name", "safety_level"]).size().unstack(fill_value=0).reset_index()
        )
        dist_sum.to_excel(xw, sheet_name="District Summary", index=False)
        overall = pd.DataFrame(
            [
                {"Metric": "total_streets", "Value": len(df)},
                {"Metric": "districts", "Value": df["district_name"].nunique()},
                {"Metric": "safe", "Value": int((df["safety_level"] == "Safe").sum())},
                {"Metric": "moderate", "Value": int((df["safety_level"] == "Moderate").sum())},
                {"Metric": "unsafe", "Value": int((df["safety_level"] == "Unsafe").sum())},
                {"Metric": "avg_score", "Value": round(float(df["infra_safety_score"].mean()), 3)},
                {"Metric": "cameras", "Value": len(cams)},
                {"Metric": "as_of", "Value": as_of},
                {"Metric": "synthetic_rows", "Value": 0},
            ]
        )
        overall.to_excel(xw, sheet_name="Summary", index=False)
    print(f"Statewide Excel -> {state_xlsx}")

    # Chunked web JSON under web/public/data/karnataka/
    web_dir = ROOT / "web" / "public" / "data" / "karnataka"
    web_dir.mkdir(parents=True, exist_ok=True)

    # summary
    summary = {
        "state": "Karnataka",
        "total_streets": len(df),
        "districts": int(df["district_name"].nunique()),
        "safe": int((df["safety_level"] == "Safe").sum()),
        "moderate": int((df["safety_level"] == "Moderate").sum()),
        "unsafe": int((df["safety_level"] == "Unsafe").sum()),
        "avg_infra_safety_score": round(float(df["infra_safety_score"].mean()), 3),
        "cameras": len(cams),
        "as_of": as_of,
        "data_source": "OpenStreetMap",
        "synthetic_rows": 0,
        "disclaimer": (
            "infra_safety_score reflects OSM infrastructure proxies "
            "(police/hospital/lighting/bus/CCTV tags), not crime incidence."
        ),
    }
    (web_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")

    # district registry
    reg = districts_registry_json(load_districts())
    (web_dir / "districts.json").write_text(json.dumps(reg, indent=2), encoding="utf-8")

    # per-district street chunks (minified points for map)
    districts_dir = web_dir / "districts"
    districts_dir.mkdir(exist_ok=True)
    index = []
    for dist, rows in sorted(by_dist.items()):
        slug = "".join(c if c.isalnum() else "_" for c in dist.lower()).strip("_")
        slim = [
            {
                "id": r["street_id"],
                "osm_way_id": r["osm_way_id"],
                "name": r["street_name"],
                "lat": r["latitude"],
                "lon": r["longitude"],
                "score": r["infra_safety_score"],
                "level": r["safety_level"],
                "confidence": r["confidence"],
                "cctv_500m": r.get("cctv_within_500m", 0),
                "nearest_camera_m": r.get("nearest_camera_m"),
            }
            for r in rows
        ]
        (districts_dir / f"{slug}.json").write_text(json.dumps(slim), encoding="utf-8")
        index.append({"district": dist, "slug": slug, "streets": len(slim)})
    (web_dir / "district_index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")

    # cameras for web
    cam_slim = [
        {
            "id": c["camera_id"],
            "lat": c["latitude"],
            "lon": c["longitude"],
            "district": c.get("district_name"),
            "source": c.get("source"),
        }
        for c in cams
    ]
    (web_dir / "cameras.json").write_text(json.dumps(cam_slim), encoding="utf-8")

    gev_meta = export_godseye_cctv()

    # shared registry for TS apps
    shared = ROOT / "shared" / "karnataka_districts.json"
    shared.write_text(json.dumps(reg, indent=2), encoding="utf-8")
    print(f"Web data -> {web_dir}")
    print(f"Shared registry -> {shared}")

    # generation log
    log = {
        "generated_at": as_of,
        "street_count": len(df),
        "camera_count": len(cams),
        "districts": index,
        "godseye_cctv": gev_meta,
        "outputs": {
            "parquet": str(pq),
            "excel": str(state_xlsx),
            "web": str(web_dir),
            "godseye_cctv": gev_meta["paths"]["exports"],
        },
    }
    (EXPORTS / "generation_log.json").write_text(json.dumps(log, indent=2), encoding="utf-8")
    return summary


if __name__ == "__main__":
    export_all()
