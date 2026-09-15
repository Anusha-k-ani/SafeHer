# SafeHer Web — Bengaluru Street Safety Dashboard

Interactive web app for **SafeHer**: OSM infrastructure scores for **46,424 streets** across **53 BBMP areas**, plus live **community crowdsourced** safety reports.

## Features

- **Dashboard** — KPI cards, safety distribution charts, top/bottom area rankings (OSM infrastructure)
- **Community** — Crowdsourced KPIs with **640 synthetic demo reports** + live user submissions
- **Report** — Browser GPS form to submit Safe/Unsafe + factors
- **Interactive Map** — OSM streets + community report layer (synthetic + live)
- **Street Search** — Search by name, ID, or area with 9-factor safety breakdown
- **Area Comparison** — Sortable table, scatter plot, and side-by-side area charts
- **Methodology** — Full documentation of the OSM data pipeline and scoring model

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + Recharts
- Leaflet + leaflet.markercluster
- Static JSON data (converted from Excel at build time)

## Prerequisites

- Node.js 18+
- The Excel dataset at `../bengaluru_street_safety_REAL.xlsx` (project root)
- Supabase keys in `.env.local` (see `.env.example`) for Community + Report features

## Setup

```bash
cd web
cp .env.example .env.local   # set NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
npm install
npm run build:data   # Convert Excel → public/data/*.json
npm run dev          # http://localhost:3000
```

## Build for Production

```bash
npm run build        # Runs build:data + next build
npm start
```

## Data Conversion

The script `scripts/convert-dataset.ts` reads the Excel workbook and outputs:

| File | Contents |
|------|----------|
| `public/data/streets.json` | All 46,424 street records (16 columns) |
| `public/data/streets.min.json` | Lightweight map points |
| `public/data/areas.json` | 53 area summaries |
| `public/data/summary.json` | Global KPIs and distributions |

Re-run `npm run build:data` when the Excel file is updated locally. On Vercel, the build uses committed JSON in `public/data/` (Excel is not required).

## Scoring Model

Nine weighted factors produce a Safety Score (0–10):

| Factor | Weight |
|--------|--------|
| Police Distance | 20% |
| Hospital Distance | 15% |
| Lighting | 15% |
| Bus Stop Count | 15% |
| Crowd Level | 10% |
| CCTV | 10% |
| Road Condition | 5% |
| Night Activity | 5% |
| Commercial Area | 5% |

- **Safe** ≥ 7.0 · **Moderate** 4.0–6.99 · **Unsafe** < 4.0

Scoring logic is mirrored in `src/lib/scoring.ts` from `create_bengaluru_dataset.py`.

## Deploy to Vercel

```bash
npx vercel
```

Or connect the `web/` folder to Vercel — build command: `npm run build`, output: Next.js default.

## Project Structure

```
web/
├── src/app/           # Pages (dashboard, map, search, areas, methodology)
├── src/components/    # UI, charts, map, search, areas
├── src/lib/           # Types, scoring, data helpers, colors
├── scripts/           # convert-dataset.ts, validate-scoring.ts
└── public/data/       # Generated JSON (gitignored if large)
```

## Source Data

- **Dataset:** `bengaluru_street_safety_REAL.xlsx`
- **Pipeline:** `create_bengaluru_dataset.py`
- **Documentation:** `Bengaluru_Street_Safety_Dataset_Process.docx`
