# Phase 2 Data Sources

## OpenStreetMap (streets, POIs, cameras)

| Asset | Source | License |
|-------|--------|---------|
| Street geometries + tags | [OpenStreetMap](https://www.openstreetmap.org/) via [Overpass API](https://overpass-api.de/) (district queries) and optionally [Geofabrik southern-zone PBF](https://download.geofabrik.de/asia/india/southern-zone.html) | ODbL |
| Police / hospital / bus / lamps / surveillance nodes | Same OSM extract | ODbL |

Provenance columns on every street row: `data_source`, `as_of`, `osm_way_id`.

## Administrative boundaries

| Asset | Source | Notes |
|-------|--------|-------|
| Karnataka districts | [civictech-India Karnataka_District_Boundary.json](https://github.com/civictech-India/DataSetsJson) (fallback: inosaint/StatesOfIndia) | Open civic district polygons |

File: `phase2/data/raw/karnataka_districts.geojson`

## Public crime context (district / commissionerate aggregates)

Downloaded via OpenCity CKAN from **Karnataka State Police / SCRB** tables:

| File under `phase2/data/raw/official/` | Content |
|----------------------------------------|---------|
| `*Total_Crimes_Registered_2023.csv` | IPC / SLL totals by unit |
| `*Sexual_Harrassment_Cases.csv` | Assault / SH cases + rates 2023 |
| `*District-wise_IPC_Crimes*_2024.csv` | Murder / rape / robbery / theft 2024 |

Joined onto streets as **district-level columns only** (`crime_grain=district_or_commissionerate_aggregate`).  
**Not** street hotspots. Do not treat as incident coordinates.

Built by: `python -m phase2.ingest_official` → `district_crime_overlay.json`.

## CCTV Layer B (public, not live police video)

| Asset | Source | Notes |
|-------|--------|-------|
| Bengaluru CCTV KML | [OpenCity](https://data.opencity.in/dataset/bengaluru-cctv-cameras) (OSM crowdsourced mirror) | → `official_cctv.csv`, `source=opencity` |
| Optional hand CSV | `phase2/data/raw/official_cctv.csv` | User-supplied official points |

**Not publicly available as downloadable lat/lon (checked):** Bengaluru Safe City tender’s ~2,744 planned sites, live Safe City / God’s Eye streams, FRS. OGD “Bangalore: CCTV Cameras” catalog currently has empty downloadable results.

## Scoring honesty

`infra_safety_score` remains an **OSM infrastructure proxy**, not a crime rate.  
Crime columns are separate context. Proxy factors stay named `proxy_*`. See `DATA_DICTIONARY.md`.
