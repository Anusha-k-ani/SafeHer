# Module 1 — Incident analysis and hotspot identification (Anusha K)

This folder **is** Module 1. Statewide **Karnataka**. Historical analysis, not crime prediction. KSP tables stay district-level.

Sibling folders: `../Module2_App/` and `../Module2_Dashboard/` (Aman Yadav).

## Run

```bash
cd "Ongoing"
python3 Module1_Analysis/pipeline.py
python3 Module1_Analysis/api.py          # http://127.0.0.1:8000
```

Import the Postman collection `postman/SafeHer_Module1.postman_collection.json`.

## Synopsis modules (all in this folder)

| # | Module | What runs |
|---|--------|-----------|
| 6.1 | Data Integration | OSM Excel (District Summary) + `input/reports.json` + `input/live_reports.json` |
| 6.2 | Pre-processing | bbox, duplicates, missing values, category names |
| 6.3 | Incident Analysis | type, time, frequency, district counts |
| 6.4 | Geospatial Analysis | ~1 km grid, district centroids, Leaflet map |
| 6.5 | Hotspot Identification | cells with ≥3 incident-like reports |
| 6.6 | Risk-Level Assessment | Low / Medium / High |
| 6.7 | Automatic Analysis Update | `POST /api/incidents` reruns the pipeline |
| 6.8 | API & Result Delivery | JSON, CSV, SVG charts, hotspot HTML map |

## Outputs

- `output/` JSON, `csv/`, `charts/`, `maps/hotspots.html`
- `database/` JSON collections (Mongo-shaped store for the demo)
- copied to `web/public/data/analysis/` and `../Module2_Dashboard/public/data/analysis/`

## APIs for Module 2 (Aman)

| Method | Path | Query |
|--------|------|--------|
| GET | `/api/statistics` | |
| GET | `/api/hotspots` | `district`, `risk` |
| GET | `/api/risk-levels` | `district` |
| GET | `/api/geography` | `district` |
| GET | `/api/incidents` | `district` |
| GET | `/api/alerts` | `district`, `risk` |
| POST | `/api/incidents` | body: `{lat, lon, district, incident_type, ...}` |
| POST | `/api/analysis/refresh` | |
| GET | `/maps/hotspots.html` | |

## Tools

Python, JSON/CSV, Excel (OSM workbook), OSM, Leaflet, FastAPI (or stdlib fallback), Postman, Git/GitHub, VS Code. Pandas/NumPy/GeoPandas/Matplotlib are listed in `requirements.txt`; this machine currently segfaults on those imports, so the same methods run on the standard library.
