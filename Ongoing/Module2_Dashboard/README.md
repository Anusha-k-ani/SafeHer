# Module 2 — Authority dashboard (Aman Yadav)

Drop the Next.js / admin dashboard here. Analysis JSON is copied into `public/data/analysis/` on every pipeline run so you can work without waiting.

Existing prototype lives in `../web/` if you want to reuse filter/chart components.

## Data already waiting

After `python3 Module1_Analysis/pipeline.py` (Anusha, Module 1):

```
public/data/analysis/
  summary.json
  hotspots.json
  alerts.json
  areas.json
  geography.json
  csv/
  charts/          # SVG risk + district frequency
  maps/hotspots.html
```

## Live API (when Anusha’s server is running)

`python3 Module1_Analysis/api.py` → `http://127.0.0.1:8000`

| Need | Call |
|------|------|
| KPIs | `GET /api/statistics` |
| Map points | `GET /api/hotspots?district=&risk=` |
| Filters | `GET /api/risk-levels?district=` |
| District geography | `GET /api/geography?district=` |
| Incident table | `GET /api/incidents?district=` |
| Alerts | `GET /api/alerts` |

Region-based analysis is query params: `district`, `risk`. Dashboard should expose those as filters (district dropdown, High/Medium/Low).

## Required screens (from your synopsis)

- Login for authorities
- Karnataka map of hotspots (Leaflet)
- Filters: district, risk, time-of-day (client-side on `hotspots.json` is fine)
- Charts: use `charts/*.svg` or Plotly against the JSON
- Self-serve: reading the JSON/API is enough — no analyst in the loop

## Honesty in the UI

- Historical concentration, not prediction
- OSM scores = modelled street-safety proxy
- KSP numbers = district totals, not map pins
