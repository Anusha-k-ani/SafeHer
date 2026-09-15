# God's Eye View bridge (SafeHer × Karnataka cameras)

SafeHer does **not** ship live police CCTV, FRS, or person tracking.

We use the open-source [God's Eye View](https://github.com/bilawalsidhu/gods-eye-view) client as a **public OSINT globe** to plot SafeHer's Karnataka **camera inventory** (OSM `man_made=surveillance` + optional official CSV).

GEV's built-in live CCTV packs are Austin / Caltrans / London TfL. Karnataka has no equivalent open stream pack in that repo, so SafeHer exports **positions** in GEV's catalog schema. Frames fall back to GEV synthetic / Street View placeholders unless you later add licensed public URLs.

## Generate the CCTV pack

```bash
python -u -m phase2.export_godseye
# or as part of:
python -u -m phase2.run_pipeline --export-only
```

Outputs:

| Path | Role |
|------|------|
| `phase2/data/exports/godseye_cctv_sources.json` | GEV catalog (≤900 cams, GEV server cap) |
| `web/public/data/karnataka/godseye_cctv_sources.json` | Same for the web app |
| `_vendor/gods-eye-view/config/cctv_sources.karnataka.json` | Written if the GEV clone exists |

Full uncropped inventory stays in `phase2/data/processed/cameras_karnataka.json` (~9k).

## Run God's Eye View on Karnataka cameras

```powershell
# once
git clone --depth 1 https://github.com/bilawalsidhu/gods-eye-view.git _vendor/gods-eye-view
cd _vendor/gods-eye-view
npm ci

# from repo root (after export_godseye)
.\scripts\run_godseye_karnataka.ps1
```

Opens `http://localhost:4173`. Turn on the **CCTV** layer and fly to Bengaluru (~12.97°N, 77.59°E).

Env the launcher sets:

- `CCTV_SOURCES_FILE=config/cctv_sources.karnataka.json`
- `CCTV_PREFER_AUSTIN=0` (do not pull Austin/Caltrans/TfL when our file is present)

Optional keys (Cesium ion / Google) improve 3D basemap — see GEV README. Not required for markers.

## Scope boundary

| In scope | Out of scope |
|----------|----------------|
| OSM + optional official camera **locations** on a globe | Live Safe City / God's Eye police video |
| Coverage priors (heading/FOV guesses) | Face recognition / person tracking |
| Police-facing Excel/Parquet street scores | Unauthorized stream scraping |

Official live feeds only via MoU → set `CameraFeedProvider(endpoint=...)` later; do not invent URLs.
