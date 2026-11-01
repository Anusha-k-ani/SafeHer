# SurakshaSetu

**Safe Spaces. Stronger Communities.**

A local citizen-and-authority system for reporting public-space concerns, recording in-app Risk Alerts, and identifying incident hotspots across Karnataka.

Academic title (kept in documentation):

**Incident Analysis and Hotspot Identification for Security Provision Against Women Harassment in Public Spaces**

BMS Institute of Technology & Management · Department of MCA  
Guide: Dr. M. Sridevi  
Module 1 (analysis): Anusha K · Module 2 (app and dashboard): Aman Yadav

Repository: [Anusha-k-ani/SafeHer](https://github.com/Anusha-k-ani/SafeHer.git)

---

## What this project is

SurakshaSetu is a **decision-support demo** that runs on your machine.

- A citizen signs in, files an incident or streetlight report, or sends a two-press **Risk Alert**.
- Records are saved in a local JSON store. They are **not** a police FIR.
- Module 1 reads that store plus Karnataka OSM inputs and writes hotspot / risk files.
- An authority account reviews incidents, SOS alerts, and analysis in a separate workspace.

## What this project is not

- It does **not** call 112 or dispatch police.
- It does **not** send SMS or push notifications to a phone.
- A place with **no reports is unknown, not safe**.
- Login is HMAC demo accounts, not OAuth or college SSO.
- The public safety map uses **labelled demonstration points** until a reviewer verifies live reports.
- Nominatim names a street only when coordinates exist. Missing names stay missing.

If someone is in immediate danger, call **112**.

---

## Repository layout

The Git repo root is this `3rd Semester` folder. The working project is `Ongoing/`.

```
3rd Semester/
  README.md                 ← you are here
  Ongoing/                  ← code, used datasets, demo diagrams
    web/                    ← Next.js citizen + authority app
    Module1_Analysis/       ← Python pipeline and result APIs
    Dataset/Karnataka/      ← districts, cameras, crime context, by_district
    Dataset/Karnataka_Streetwise/csv/  ← street CSVs used for coverage
    Module2_App/            ← Module 2 mobile stub (Aman)
    Module2_Dashboard/      ← Module 2 dashboard stub (Aman)
    mobile/                 ← earlier Expo prototype
    shared/  supabase/      ← leftover Path-A pieces (not the live store)
    .archify/               ← demonstration diagrams (open the HTML files)
```

PDFs, PPTs, unused Excel/parquet dumps, and generation checkpoints live **outside** this folder:

`/Users/anushak/Documents/Not_for_Running`

---

## Run the demonstration

### App (Module 2 path — live web)

Need Node.js 20 (the wrapper prefers `~/.nvm/versions/node/v20.17.0` if present).

```bash
cd Ongoing/web
npm install
npm run dev
```

Open **http://127.0.0.1:3000**

In Cursor, run that from the Cursor terminal, not Mac Terminal.app. First page compile can take a minute.

| Account    | Username    | Password         | Opens              |
|------------|-------------|------------------|--------------------|
| Citizen    | `citizen`   | `suraksha-demo`  | Home, reports, SOS |
| Supervisor | `supervisor`| `suraksha-demo`  | Authority workspace|
| Reviewer   | `reviewer`  | `suraksha-demo`  | Authority workspace|
| Patrol     | `patrol`    | `suraksha-demo`  | Patrol tasks       |
| Municipal  | `municipal` | `suraksha-demo`  | Streetlight work   |
| Admin      | `admin`     | `suraksha-demo`  | Full workspace     |

Suggested walkthrough:

1. Login as `citizen`.
2. **Report an incident** (optional GPS).
3. Press **Risk Alert** once to arm, again within 3 seconds to send. It does not call 112.
4. Open **Safety Map** and **My Reports**.
5. Log out. Login as `supervisor`.
6. Show incidents, SOS alerts, and hotspot / temporal pages.

### Analysis (Module 1)

From `Ongoing/`:

```bash
python3 Module1_Analysis/pipeline.py
python3 Module1_Analysis/api.py
```

The pipeline reads `web/data/suraksha-store.json` (or `SURAKSHA_STORE`) and Karnataka inputs. It writes `Module1_Analysis/output/` and copies analysis JSON into `web/public/data/analysis/`.

Published hotspot rule: **0.01° grid (~1 km)** and **at least 3 points**. Empty cells are never labelled safe.

---

## Product surfaces

### Citizen

| Page | What it does |
|------|----------------|
| Home | Welcome, recent reports, notices |
| Report an incident | Dated concern + optional GPS |
| Report a streetlight | Infrastructure fault |
| Risk Alert | Two-press in-app SOS (also a bar at the bottom of every page) |
| Safety Map | Aggregated / labelled demo overlay |
| My Reports | The signed-in citizen’s own rows |
| Notifications | In-app inbox only |
| Safety Resources | Incident vs safety guidance |

### Authority

Separate workspace. Not the citizen home with different labels.

- Incident management and SOS alerts
- Hotspot and temporal intelligence
- District analysis and coverage
- Streetlights, patrol tasks, exports, data quality, audit

Patrol tasks and municipal referrals are **demonstration records**.

---

## Data and honesty

**Used datasets (in this repo folder)**

- `Dataset/Karnataka/osm_districts.json`
- `Dataset/Karnataka/crime_context.json`
- `Dataset/Karnataka/district_crime_overlay.json`
- `Dataset/Karnataka/karnataka_districts.geojson`
- `Dataset/Karnataka/karnataka_cameras.json`
- `Dataset/Karnataka/by_district/`
- `Dataset/Karnataka/official/`
- `Dataset/Karnataka_Streetwise/csv/`

**Operational store (local, not committed)**

- `Ongoing/web/data/suraksha-store.json`  
  Collections: `reports`, `sos`, `lights`, `units`, `tasks`, `notices`, `audit`

**Unused workbooks and extract leftovers** were moved to `Documents/Not_for_Running/Unused_datasets`. Bengaluru Excel is not the live store.

Maps stay demo-driven until verified reports exist. Do not invent street names, USNs, citations, or “verified” rows in the real store.

---

## Demonstration diagrams

Open these HTML files in a browser (dark/light, export). Start with the explainer.

| Artifact | File |
|----------|------|
| Demo script (start here) | `Ongoing/.archify/explainer-demo-20261101-142119/suraksha-explainer.html` |
| Architecture | `Ongoing/.archify/architecture-demo-20261101-142119/suraksha-architecture.html` |
| Workflow | `Ongoing/.archify/workflow-demo-20261101-142119/suraksha-workflow.html` |
| Sequence | `Ongoing/.archify/sequence-demo-20261101-142119/suraksha-sequence.html` |
| Dataflow | `Ongoing/.archify/dataflow-demo-20261101-142119/suraksha-dataflow.html` |
| Lifecycle | `Ongoing/.archify/lifecycle-demo-20261101-142119/suraksha-lifecycle.html` |
| ERD | `Ongoing/.archify/erd-demo-20261101-142119/suraksha-erd.html` |
| Class | `Ongoing/.archify/class-demo-20261101-142119/suraksha-class.html` |
| Tree | `Ongoing/.archify/tree-demo-20261101-142119/suraksha-tree.html` |
| Timeline | `Ongoing/.archify/timeline-demo-20261101-142119/suraksha-timeline.html` |
| Waterfall | `Ongoing/.archify/waterfall-demo-20261101-142119/suraksha-waterfall.html` |

Timeline dates and waterfall durations are **illustrative**, not a measured production trace.

---

## Tech

| Layer | Stack |
|-------|--------|
| Citizen / authority UI | Next.js 16 App Router, TypeScript, Tailwind v4, Leaflet |
| Auth | HMAC cookie `suraksha_session`, demo users in `web/src/lib/suraksha/domain.ts` |
| Store | JSON file via `web/src/lib/suraksha/store.ts` |
| Place names | OpenStreetMap Nominatim when GPS exists |
| Module 1 | Python 3, stdlib + existing analysis scripts |
| Start command | `Ongoing/web/scripts/run-next.cjs` (Node 20, telemetry off, CSS prebuild) |

Supabase is leftover Path-A code. It is **not** the operational store. The citizen map must not load it.

---

## What not to commit

Already ignored:

- `node_modules/`, `.next/`, `.venv/`
- `.env`, `.env.local`
- `web/data/suraksha-store.json` (live operational records)
- `Dataset/Karnataka_Streetwise/` bulk extract (coverage totals are in `web/public/data/analysis`)
- `*.parquet`, `*.zip`

Commit from **your** Git name, not Cursor. Do not amend a commit that was already pushed.

---

## Team branches (optional)

```bash
git checkout -b anusha/module1-analysis
git checkout -b aman/module2-app
```

Work in `Ongoing/`. Keep PDFs and slides out of this repo; they are already in `Documents/Not_for_Running`.
