# Module 2 — Mobile application (Aman Yadav)

Drop the Expo / React Native app here. Anusha’s Module 1 analysis is already producing Karnataka hotspots; this folder is yours so you can work in parallel.

Module 1 (Anusha) lives in `../Module1_Analysis/`. Existing prototype (Bengaluru-oriented) lives in `../mobile/` if you want to copy pieces. Do not wait on analysis — the API contract below is stable.

## What you build

- Report an incident with GPS (`lat`, `lon`)
- Optional district / area label
- Submit to Module 1: `POST http://127.0.0.1:8000/api/incidents`
- Show community map using `GET /api/hotspots` (or bundled `public` JSON later)

## Submit body (example)

See `contracts/incident_submit.example.json`. Required: `lat`, `lon`. Useful: `district`, `incident_type`, `harassment_reported`, `is_safe`, `time_of_day`, `created_at`.

After POST, Module 1 reruns clustering and updates:

- `../Module1_Analysis/output/hotspots.json`
- `../Module2_Dashboard/public/data/analysis/`

## Do not

- Do not treat KSP tables as street dots
- Do not claim crime prediction
- Do not put analysis scripts here

## Suggested layout

```
src/          # screens, GPS, report form
assets/
app.json
package.json
```
