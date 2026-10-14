"""Module 1 result APIs (synopsis 5.8 / 6.8).

Mobile app → POST /api/incidents → live_reports.json → pipeline rerun → dashboard JSON.

  python3 Module1_Analysis/api.py
  # http://127.0.0.1:8000

Uses FastAPI when installed; otherwise the same routes on Python's http.server.
Pandas/GeoPandas/Matplotlib are not imported here (they SIGSEGV on this machine).
"""
from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import pipeline  # noqa: E402

HOST, PORT = "127.0.0.1", 8000


def _load(name: str, default: Any):
    path = pipeline.OUTPUT / name
    if not path.exists():
        path = pipeline.DATABASE / name
    return pipeline._load_json(path, default)


def ensure_results() -> None:
    if not (pipeline.OUTPUT / "summary.json").exists():
        pipeline.run(write_dashboard=True)


def statistics() -> dict:
    ensure_results()
    return _load("summary.json", {})


def hotspots(district: str | None = None, risk: str | None = None) -> list:
    ensure_results()
    return pipeline.filter_region(_load("hotspots.json", []), district, risk)


def risk_levels(district: str | None = None) -> dict:
    rows = hotspots(district=district)
    from collections import Counter

    c = Counter(r.get("risk_level") for r in rows)
    return {
        "district": district or "Karnataka",
        "Low": c.get("Low", 0),
        "Medium": c.get("Medium", 0),
        "High": c.get("High", 0),
        "hotspot_count": len(rows),
        "areas": pipeline.filter_region(_load("areas.json", []), district),
    }


def geography(district: str | None = None) -> dict:
    ensure_results()
    geo = _load("geography.json", {})
    if district:
        d = district.strip().lower()
        geo = dict(geo)
        geo["districts"] = [x for x in geo.get("districts") or [] if str(x.get("district", "")).lower() == d]
    return geo


def incidents(district: str | None = None) -> list:
    ensure_results()
    return pipeline.filter_region(_load("incident_view.json", []), district)


def alerts(district: str | None = None, risk: str | None = None) -> list:
    ensure_results()
    return pipeline.filter_region(_load("alerts.json", []), district, risk)


def street_stats(district: str | None = None) -> dict:
    ensure_results()
    data = _load("street_stats.json", {})
    if district and isinstance(data, dict):
        d = district.strip().lower()
        by = data.get("by_district") or {}
        hit = next((k for k in by if k.lower() == d), None)
        return {"district": hit or district, "streets": by.get(hit) if hit else None, "synopsis_features": data.get("synopsis_features")}
    return data


def street_matches(district: str | None = None) -> list:
    ensure_results()
    rows = _load("street_matches.json", [])
    if district:
        d = district.strip().lower()
        rows = [r for r in rows if str(r.get("point_district") or "").lower() == d]
    return rows


def cameras(district: str | None = None) -> dict:
    ensure_results()
    data = _load("cameras.json", {})
    cams = data.get("cameras") or []
    if district:
        d = district.strip().lower()
        cams = [c for c in cams if str(c.get("district_name") or "").lower() == d]
    slim = [
        {
            "camera_id": c.get("camera_id"),
            "latitude": c.get("latitude"),
            "longitude": c.get("longitude"),
            "district_name": c.get("district_name"),
            "camera_class": c.get("camera_class"),
            "setting": c.get("setting"),
            "is_public_context": c.get("is_public_context"),
            "source": c.get("source"),
        }
        for c in cams
    ]
    return {"count": len(slim), "note": data.get("note"), "cameras": slim}


def ingest_incident(body: dict) -> dict:
    """6.7 Mobile app → API → store → analysis update."""
    if body.get("lat") is None or body.get("lon") is None:
        raise ValueError("lat and lon are required")
    live = pipeline._load_json(pipeline.LIVE_REPORTS, [])
    if not isinstance(live, list):
        live = live.get("reports") or []
    row = dict(body)
    row.setdefault("status", "approved")
    row.setdefault("is_synthetic", False)
    live.append(row)
    pipeline.LIVE_REPORTS.write_text(json.dumps(live, indent=2), encoding="utf-8")
    summary = pipeline.run(write_dashboard=True)
    return {
        "accepted": True,
        "stored_in": str(pipeline.LIVE_REPORTS),
        "hotspot_count": summary["hotspot_count"],
        "alert_count": summary["alert_count"],
        "risk_counts": summary["risk_counts"],
    }


def refresh() -> dict:
    return pipeline.run(write_dashboard=True)


try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, JSONResponse

    app = FastAPI(title="SafeHer Module 1 Analysis API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"ok": True, "module": 1, "engine": "fastapi"}

    @app.get("/api/statistics")
    @app.get("/api/v1/statistics")
    def api_statistics():
        return statistics()

    @app.get("/api/hotspots")
    @app.get("/api/v1/hotspots")
    def api_hotspots(district: str | None = Query(None), risk: str | None = Query(None)):
        return hotspots(district, risk)

    @app.get("/api/risk-levels")
    @app.get("/api/v1/risk-levels")
    def api_risk(district: str | None = Query(None)):
        return risk_levels(district)

    @app.get("/api/geography")
    @app.get("/api/v1/geography")
    def api_geo(district: str | None = Query(None)):
        return geography(district)

    @app.get("/api/incidents")
    @app.get("/api/v1/incidents")
    def api_incidents(district: str | None = Query(None)):
        return incidents(district)

    @app.get("/api/alerts")
    @app.get("/api/v1/alerts")
    def api_alerts(district: str | None = Query(None), risk: str | None = Query(None)):
        return alerts(district, risk)

    @app.get("/api/street-stats")
    @app.get("/api/v1/street-stats")
    def api_streets(district: str | None = Query(None)):
        return street_stats(district)

    @app.get("/api/street-matches")
    @app.get("/api/v1/street-matches")
    def api_street_matches(district: str | None = Query(None)):
        return street_matches(district)

    @app.get("/api/cameras")
    @app.get("/api/v1/cameras")
    def api_cameras(district: str | None = Query(None)):
        return cameras(district)

    @app.post("/api/incidents")
    @app.post("/api/v1/incidents")
    def api_post_incident(body: dict):
        try:
            return ingest_incident(body)
        except ValueError as e:
            raise HTTPException(400, str(e)) from e

    @app.post("/api/analysis/refresh")
    @app.post("/api/v1/analysis/refresh")
    def api_refresh():
        return refresh()

    @app.get("/maps/hotspots.html")
    def api_map():
        path = pipeline.OUTPUT / "maps" / "hotspots.html"
        if not path.exists():
            ensure_results()
        return FileResponse(path, media_type="text/html")

except ImportError:
    app = None  # stdlib server below


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # quieter
        sys.stderr.write("API " + (fmt % args) + "\n")

    def _cors(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json(self, code: int, obj) -> None:
        raw = json.dumps(obj, indent=2).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _html_file(self, path: Path) -> None:
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self._cors()
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):  # noqa: N802
        u = urlparse(self.path)
        q = {k: v[-1] for k, v in parse_qs(u.query).items()}
        path = u.path.rstrip("/") or "/"
        try:
            if path == "/health":
                return self._json(200, {"ok": True, "module": 1, "engine": "stdlib"})
            if path in ("/api/statistics", "/api/v1/statistics"):
                return self._json(200, statistics())
            if path in ("/api/hotspots", "/api/v1/hotspots"):
                return self._json(200, hotspots(q.get("district"), q.get("risk")))
            if path in ("/api/risk-levels", "/api/v1/risk-levels"):
                return self._json(200, risk_levels(q.get("district")))
            if path in ("/api/geography", "/api/v1/geography"):
                return self._json(200, geography(q.get("district")))
            if path in ("/api/incidents", "/api/v1/incidents"):
                return self._json(200, incidents(q.get("district")))
            if path in ("/api/alerts", "/api/v1/alerts"):
                return self._json(200, alerts(q.get("district"), q.get("risk")))
            if path in ("/api/street-stats", "/api/v1/street-stats"):
                return self._json(200, street_stats(q.get("district")))
            if path in ("/api/street-matches", "/api/v1/street-matches"):
                return self._json(200, street_matches(q.get("district")))
            if path in ("/api/cameras", "/api/v1/cameras"):
                return self._json(200, cameras(q.get("district")))
            if path == "/maps/hotspots.html":
                p = pipeline.OUTPUT / "maps" / "hotspots.html"
                if not p.exists():
                    ensure_results()
                return self._html_file(p)
            return self._json(404, {"error": "not found", "path": path})
        except Exception as e:  # noqa: BLE001
            return self._json(500, {"error": str(e)})

    def do_POST(self):  # noqa: N802
        u = urlparse(self.path)
        path = u.path.rstrip("/") or "/"
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return self._json(400, {"error": "invalid JSON"})
        try:
            if path in ("/api/incidents", "/api/v1/incidents"):
                return self._json(200, ingest_incident(body if isinstance(body, dict) else {}))
            if path in ("/api/analysis/refresh", "/api/v1/analysis/refresh"):
                return self._json(200, refresh())
            return self._json(404, {"error": "not found", "path": path})
        except ValueError as e:
            return self._json(400, {"error": str(e)})
        except Exception as e:  # noqa: BLE001
            return self._json(500, {"error": str(e)})


def main() -> None:
    ensure_results()
    if app is not None:
        try:
            import uvicorn

            print(f"FastAPI http://{HOST}:{PORT}")
            uvicorn.run(app, host=HOST, port=PORT, log_level="info")
            return
        except ImportError:
            pass
    print(f"stdlib API http://{HOST}:{PORT}  (pip install fastapi uvicorn for the FastAPI engine)")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
