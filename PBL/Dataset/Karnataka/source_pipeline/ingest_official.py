"""Ingest public official/open layers: OpenCity crime CSVs + Bengaluru CCTV KML.

Sources (not invented):
- data.opencity.in ← ksp.karnataka.gov.in district/city crime tables
- data.opencity.in Bengaluru CCTV KML (crowdsourced OSM mirror; labeled as such)

Does NOT include live Safe City video, FRS, or unpublished police camera registries.
"""
from __future__ import annotations

import csv
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

from phase2.config import OFFICIAL_CCTV_CSV, RAW

OFFICIAL_DIR = RAW / "official"
CRIME_OUT = OFFICIAL_DIR / "district_crime_overlay.json"
KML_GLOB = "bengaluru-cctv-cameras__*.kml"

# Map KSP/OpenCity unit names → our district_name (streets use civictech names)
UNIT_TO_DISTRICT = {
    "bagalkot": "Bagalkote",
    "bagalkote": "Bagalkote",
    "ballari": "Ballari",
    "bellary": "Ballari",
    "belagavi": "Belagavi",
    "belagavi district": "Belagavi",
    "belgaum": "Belagavi",
    "bengaluru city": "Bengaluru Urban",
    "bengaluru urban": "Bengaluru Urban",
    "bangalore city": "Bengaluru Urban",
    "bengaluru district": "Bengaluru Rural",
    "bengaluru rural": "Bengaluru Rural",
    "bidar": "Bidar",
    "chamarajanagar": "Chamrajnagar",
    "chamrajnagar": "Chamrajnagar",
    "chikkaballapura": "Chikkaballapura",
    "chikkaballapur": "Chikkaballapura",
    "chikkamagaluru": "Chikmagalur",
    "chikmagalur": "Chikmagalur",
    "chitradurga": "Chitradurga",
    "dakshina kannada": "Dakshina Kannada",
    "davanagere": "Davanagere",
    "davangere": "Davanagere",
    "dharwad": "Dharwad",
    "hubballi dharwad city": "Dharwad",
    "gadag": "Gadag",
    "hassan": "Hassan",
    "haveri": "Haveri",
    "kalaburagi": "Kalaburagi",
    "gulbarga": "Kalaburagi",
    "kodagu": "Kodagu",
    "kolar": "Kolar",
    "koppal": "Koppal",
    "mandya": "Mandya",
    "mysuru": "Mysuru",
    "mysuru city": "Mysuru",
    "mysuru district": "Mysuru",
    "mangaluru city": "Dakshina Kannada",
    "raichur": "Raichur",
    "ramanagara": "Ramanagara",
    "ramanagar": "Ramanagara",
    "shivamogga": "Shivamogga",
    "shimoga": "Shivamogga",
    "tumakuru": "Tumakuru",
    "tumkur": "Tumakuru",
    "udupi": "Udupi",
    "uttara kannada": "Uttara Kannada",
    "vijayapura": "Vijayapura",
    "bijapur": "Vijayapura",
    "yadgir": "Yadgir",
    "yadagiri": "Yadgir",
}


def _norm_unit(name: str) -> str:
    s = (name or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s


def map_unit(name: str) -> str | None:
    return UNIT_TO_DISTRICT.get(_norm_unit(name))


def _read_csv(path: Path) -> list[dict]:
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def build_crime_overlay() -> dict:
    """District-level crime context from OpenCity/KSP CSVs (not street incidents)."""
    overlay: dict[str, dict] = {}

    def bump(district: str, **fields):
        row = overlay.setdefault(
            district,
            {
                "district_name": district,
                "crime_source": "OpenCity ← KSP (ksp.karnataka.gov.in)",
                "crime_grain": "district_or_commissionerate_aggregate",
                "crime_note": (
                    "NOT street-level incidents. Do not treat as hotspot coordinates."
                ),
            },
        )
        row.update({k: v for k, v in fields.items() if v is not None})

    # 2023 totals + sexual harassment
    totals = OFFICIAL_DIR / (
        "karnataka-crime-data-2023__District_and_City-wise_Total_Crimes_Registered_2023.csv"
    )
    if totals.exists():
        for r in _read_csv(totals):
            d = map_unit(r.get("Districts") or "")
            if not d:
                continue
            bump(
                d,
                ipc_cases_2023=_int(r.get("IPC Cases")),
                sll_cases_2023=_int(r.get("SLL Cases")),
                total_cases_2023=_int(r.get("Total")),
            )

    sh = OFFICIAL_DIR / (
        "karnataka-crime-data-2023__District_and_City-wise_Sexual_Harrassment_Cases.csv"
    )
    if sh.exists():
        for r in _read_csv(sh):
            d = map_unit(r.get("Districts") or "")
            if not d:
                continue
            bump(
                d,
                assault_modesty_incidents_2023=_int(
                    r.get(
                        "Assault on Women with Intent to Outrage her Modesty - Incidents (I)"
                    )
                ),
                sexual_harassment_total_i_2023=_int(
                    r.get("Sexual Harrassment Total - I")
                ),
                sexual_harassment_rate_2023=_float(
                    r.get("Sexual Harrassment Total - R")
                ),
            )

    ipc24 = OFFICIAL_DIR / (
        "karnataka-crime-data-2024__District-wise_IPC_Crimes_in_Karnataka_-_2024.csv"
    )
    if ipc24.exists():
        for r in _read_csv(ipc24):
            d = map_unit(r.get("DISTRICT/UNITS") or "")
            if not d:
                continue
            bump(
                d,
                murder_2024=_int(r.get("MURDER")),
                rape_2024=_int(r.get("RAPE")),
                robbery_2024=_int(r.get("ROBBERY")),
                theft_2024=_int(r.get("THEFT")),
            )

    CRIME_OUT.write_text(json.dumps({"districts": overlay}, indent=2), encoding="utf-8")
    print(f"Crime overlay districts: {len(overlay)} -> {CRIME_OUT}", flush=True)
    return overlay


def _int(v) -> int | None:
    try:
        if v is None or str(v).strip() == "":
            return None
        return int(float(str(v).replace(",", "")))
    except ValueError:
        return None


def _float(v) -> float | None:
    try:
        if v is None or str(v).strip() == "":
            return None
        return float(str(v).replace(",", ""))
    except ValueError:
        return None


def kml_to_official_cctv() -> int:
    """Write OpenCity Bengaluru CCTV KML → official_cctv.csv (community OSM mirror)."""
    files = list(OFFICIAL_DIR.glob(KML_GLOB))
    if not files:
        print("No Bengaluru CCTV KML found", flush=True)
        return 0
    kml = files[0]
    root = ET.parse(kml).getroot()
    # handle default ns
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    rows = []
    for pm in root.iter(f"{ns}Placemark"):
        name_el = pm.find(f"{ns}name")
        name = (name_el.text or "").strip() if name_el is not None else ""
        coord_el = pm.find(f".//{ns}coordinates")
        if coord_el is None or not (coord_el.text or "").strip():
            continue
        parts = coord_el.text.strip().split(",")
        if len(parts) < 2:
            continue
        lon, lat = float(parts[0]), float(parts[1])
        rows.append(
            {
                "id": f"opencity_blr_{len(rows)+1}",
                "lat": f"{lat:.7f}",
                "lon": f"{lon:.7f}",
                "district": "Bengaluru Urban",
                "district_code": "",
                "type": "opencity_kml",
                "jurisdiction": "OpenCity Bengaluru CCTV (OSM crowdsourced mirror)",
                "as_of": "opencity-download",
                "source": "opencity",
            }
        )

    OFFICIAL_CCTV_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OFFICIAL_CCTV_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(
            f,
            fieldnames=[
                "id",
                "lat",
                "lon",
                "district",
                "district_code",
                "type",
                "jurisdiction",
                "as_of",
                "source",
            ],
        )
        w.writeheader()
        w.writerows(rows)
    print(f"Official/OpenCity CCTV CSV: {len(rows)} -> {OFFICIAL_CCTV_CSV}", flush=True)
    return len(rows)


def run():
    OFFICIAL_DIR.mkdir(parents=True, exist_ok=True)
    n = kml_to_official_cctv()
    overlay = build_crime_overlay()
    return {"cctv_rows": n, "crime_districts": len(overlay)}


if __name__ == "__main__":
    print(run())
