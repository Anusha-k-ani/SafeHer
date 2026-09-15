# SafeHer — Phase I (Karnataka)

One project, two modules. Title stays:

**Incident Analysis and Hotspot Identification for Security Provision Against Women Harassment in Public Spaces**

```
Ongoing/
  Module1_Analysis/     ← Anusha K   (1BY25MC017)  DONE
  Module2_App/          ← Aman Yadav (1BY25MC012)  add Expo app here
  Module2_Dashboard/    ← Aman Yadav (1BY25MC012)  add admin dashboard here
```

| Folder | Person | USN | What |
|--------|--------|-----|------|
| **`Module1_Analysis/`** | Anusha K | 1BY25MC017 | Module 1 — data integration, preprocess, incident analysis, geospatial analysis, hotspot identification, risk, auto-update, result APIs |
| **`Module2_App/`** | Aman Yadav | 1BY25MC012 | Module 2 — mobile application |
| **`Module2_Dashboard/`** | Aman Yadav | 1BY25MC012 | Module 2 — authority dashboard |

Work in parallel: Module 1 writes JSON/CSV/maps; Aman reads `Module2_Dashboard/public/data/analysis/` or `http://127.0.0.1:8000`.

Earlier Bengaluru prototype (reuse if useful, do not delete): `mobile/`, `web/`, `supabase/`, `shared/`.

Dataset: `../PBL/Dataset/Karnataka/`.

## Module 1 (Anusha)

```bash
python3 Module1_Analysis/pipeline.py
python3 Module1_Analysis/api.py
```

See `Module1_Analysis/README.md`.

## Module 2 (Aman)

Add Expo code under `Module2_App/` and the admin UI under `Module2_Dashboard/`. Contracts are in those READMEs.

## Git (same repo, two people)

```bash
git checkout -b anusha/module1-analysis    # Anusha
git checkout -b aman/module2-app           # Aman
```

Do not commit `Module1_Analysis/input/live_reports.json` secrets, `.env`, or `PBL/Archives/*.zip`.
