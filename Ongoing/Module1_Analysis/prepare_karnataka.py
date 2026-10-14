"""Build Module 1 inputs from Dataset/Karnataka (no pandas)."""
from __future__ import annotations

import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
DATASET = HERE.parent / "Dataset" / "Karnataka"
INPUT = HERE / "input"

NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
XLSX = DATASET / "karnataka_street_safety.xlsx"


def _cell(c, strings):
    t = c.attrib.get("t")
    is_elem = c.find(f"{NS}is")
    v = c.find(f"{NS}v")
    if t == "inlineStr" and is_elem is not None:
        return "".join(is_elem.itertext())
    if v is None:
        return None
    if t == "s":
        return strings[int(v.text)]
    return v.text


def _sheet(z: ZipFile, path: str) -> list[list]:
    strings: list[str] = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall(f"{NS}si"):
            strings.append("".join(si.itertext()))
    sroot = ET.fromstring(z.read(path))
    rows = []
    for row in sroot.findall(f"{NS}sheetData/{NS}row"):
        rows.append([_cell(c, strings) for c in row])
    return rows


def _centroid(geom) -> tuple[float | None, float | None]:
    pts: list[tuple[float, float]] = []

    def walk(g):
        if isinstance(g, list) and g and isinstance(g[0], (int, float)):
            pts.append((float(g[0]), float(g[1])))
            return
        if isinstance(g, list):
            for x in g:
                walk(x)

    walk(geom)
    if not pts:
        return None, None
    lon = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    return round(lat, 5), round(lon, 5)


def load_district_summary() -> tuple[list[dict], dict]:
    with ZipFile(XLSX) as z:
        dist_rows = _sheet(z, "xl/worksheets/sheet2.xml")
        summary_rows = _sheet(z, "xl/worksheets/sheet3.xml")
    header, *body = dist_rows
    districts = []
    for row in body:
        rec = {header[i]: row[i] for i in range(len(header))}
        safe = int(float(rec.get("Safe") or 0))
        moderate = int(float(rec.get("Moderate") or 0))
        unsafe = int(float(rec.get("Unsafe") or 0))
        total = safe + moderate + unsafe
        share = round(unsafe / total, 4) if total else 0
        if share >= 0.45:
            osm_risk = "High"
        elif share >= 0.20:
            osm_risk = "Medium"
        else:
            osm_risk = "Low"
        districts.append(
            {
                "district": rec["district_name"],
                "osm_street_count": total,
                "osm_safe": safe,
                "osm_moderate": moderate,
                "osm_unsafe": unsafe,
                "osm_unsafe_share": share,
                "osm_risk_level": osm_risk,
            }
        )
    workbook = {str(r[0]): r[1] for r in summary_rows[1:] if r and r[0]}
    return districts, workbook


def attach_centroids(districts: list[dict]) -> None:
    geo = json.loads((DATASET / "karnataka_districts.geojson").read_text(encoding="utf-8"))
    cents = {}
    for f in geo["features"]:
        name = f["properties"]["district_name"]
        lat, lon = _centroid(f["geometry"]["coordinates"])
        cents[name] = (lat, lon)
    for d in districts:
        lat, lon = cents.get(d["district"], (None, None))
        d["latitude"], d["longitude"] = lat, lon


def attach_crime_and_cameras(districts: list[dict]) -> dict:
    crime = json.loads((DATASET / "district_crime_overlay.json").read_text(encoding="utf-8"))
    counts = json.loads((DATASET / "osm_street_counts.json").read_text(encoding="utf-8"))
    cameras = {r["district_name"]: r.get("cameras") or 0 for r in counts["districts"]}
    overlay = crime.get("districts") or {}
    for d in districts:
        c = overlay.get(d["district"]) or {}
        d["osm_cameras"] = cameras.get(d["district"], 0)
        d["ksp_total_cases_2023"] = c.get("total_cases_2023")
        d["ksp_assault_modesty_2023"] = c.get("assault_modesty_incidents_2023")
        d["ksp_sexual_harassment_2023"] = c.get("sexual_harassment_total_i_2023")
        d["ksp_sexual_harassment_rate_2023"] = c.get("sexual_harassment_rate_2023")
        d["crime_used_as_coordinates"] = False
    return crime


def make_reports(districts: list[dict]) -> list[dict]:
    """Demo app-schema rows for every district. Weighted by OSM unsafe streets. Not KSP points."""
    rng = random.Random(42)
    start = datetime(2026, 6, 1, tzinfo=timezone.utc)
    tods = ["morning", "afternoon", "evening", "night"]
    rows = []
    n = 0
    for d in districts:
        lat0, lon0 = d["latitude"], d["longitude"]
        if lat0 is None:
            continue
        count = 12 + min(40, int(d["osm_unsafe"] / 400))
        # two tight clusters so ~1 km hotspot cells form (concentration, not a forecast)
        foci = [
            (lat0 + rng.uniform(-0.02, 0.02), lon0 + rng.uniform(-0.02, 0.02)),
            (lat0 + rng.uniform(-0.03, 0.03), lon0 + rng.uniform(-0.03, 0.03)),
        ]
        for i in range(count):
            n += 1
            incident = rng.random() < (0.35 + 0.25 * d["osm_unsafe_share"])
            har = incident and rng.random() < 0.45
            cy, cx = foci[0] if rng.random() < 0.7 else foci[1]
            jitter = 0.006 if incident else 0.04
            lat = cy + rng.uniform(-jitter, jitter)
            lon = cx + rng.uniform(-jitter, jitter)
            created = start + timedelta(days=rng.randint(0, 70), hours=rng.randint(0, 23), minutes=rng.randint(0, 59))
            rows.append(
                {
                    "id": f"ka_{n:05d}",
                    "created_at": created.isoformat().replace("+00:00", "Z"),
                    "lat": round(lat, 6),
                    "lon": round(lon, 6),
                    "area": d["district"],
                    "district": d["district"],
                    "is_safe": not incident,
                    "safety_rating": rng.randint(1, 3) if incident else rng.randint(3, 5),
                    "lighting_ok": rng.random() > 0.5,
                    "crowd_level": rng.randint(1, 5),
                    "police_nearby": rng.random() > 0.7,
                    "cctv_seen": rng.random() > 0.6,
                    "harassment_reported": har,
                    "transport_nearby": rng.random() > 0.4,
                    "comment": None,
                    "time_of_day": rng.choice(tods),
                    "reporter_id": None,
                    "device_id": "synthetic",
                    "status": "approved",
                    "is_synthetic": True,
                }
            )
    return rows


def main() -> None:
    if not XLSX.exists():
        raise SystemExit(f"Missing {XLSX}")
    districts, workbook = load_district_summary()
    attach_centroids(districts)
    crime = attach_crime_and_cameras(districts)
    payload = {
        "state": "Karnataka",
        "as_of": workbook.get("as_of"),
        "workbook_total_streets": int(float(workbook.get("total_streets") or 0)),
        "workbook_avg_score": float(workbook.get("avg_score") or 0),
        "workbook_cameras": int(float(workbook.get("cameras") or 0)),
        "source": str(XLSX),
        "note": "OSM street safety scores are a modelled 9-factor proxy. KSP figures are district aggregates, not street points.",
        "districts": districts,
    }
    DATASET.mkdir(parents=True, exist_ok=True)
    INPUT.mkdir(parents=True, exist_ok=True)
    (DATASET / "osm_districts.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    (INPUT / "osm_districts.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")

    crime_out = {
        "note": "District/commissionerate aggregates (OpenCity ← KSP). Not street-level. Never used as hotspot coordinates.",
        "used_in_pipeline": False,
        "role": "context_only",
        "state": "Karnataka",
        "districts": crime.get("districts") or {},
    }
    (DATASET / "crime_context.json").write_text(json.dumps(crime_out, indent=2), encoding="utf-8")
    (INPUT / "crime_context.json").write_text(json.dumps(crime_out, indent=2), encoding="utf-8")

    reports = make_reports(districts)
    (INPUT / "reports.json").write_text(json.dumps(reports), encoding="utf-8")
    (INPUT / "live_reports.json").write_text("[]\n", encoding="utf-8")
    (INPUT / "SOURCES.json").write_text(
        json.dumps(
            {
                "dataset_folder": str(DATASET),
                "karnataka_street_safety.xlsx": "Statewide OSM street workbook (30 districts). Analysis uses District Summary sheet, not the 50k sample sheet.",
                "osm_districts.json": "Per-district Safe/Moderate/Unsafe counts + centroids.",
                "crime_context.json": "KSP district totals for all 30 districts. Context only.",
                "reports.json": "Synthetic app-schema reports for every Karnataka district, weighted by OSM unsafe streets. Replaced by live_reports.json when the app is connected.",
                "live_reports.json": "Optional live dump from the app/Supabase.",
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print("districts", len(districts), "reports", len(reports))
    print("missing centroid", [d["district"] for d in districts if d["latitude"] is None])
    print("Wrote", DATASET / "osm_districts.json")
    print("Wrote", INPUT / "reports.json")


if __name__ == "__main__":
    main()
