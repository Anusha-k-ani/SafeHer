# Karnataka street-safety dataset (Phase 2 OSM extract)

Statewide OpenStreetMap street layer for **30 Karnataka districts**.

| File | What it is |
|---|---|
| `karnataka_street_safety.xlsx` | Workbook: 50k street sample + **District Summary** + totals |
| `osm_districts.json` | Per-district Safe / Moderate / Unsafe counts used by Module 1 |
| `karnataka_districts.geojson` | District boundaries |
| `district_crime_overlay.json` | KSP district totals (context only, not hotspot points) |
| `karnataka_cameras.parquet` | Camera inventory locations |
| `osm_street_counts.json` | Street and camera counts by district |
| `generation_log.json` | Extract metadata (as of 2026-09-14) |

Workbook totals: **604,573** scored streets · avg score **4.16** · **5,578** cameras · **0** synthetic street rows.

Module 1 reads this folder via `Ongoing/Module1_Analysis/pipeline.py`.
