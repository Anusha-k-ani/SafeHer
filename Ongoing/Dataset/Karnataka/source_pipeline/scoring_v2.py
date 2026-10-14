"""Scoring v2 — auditable infra proxies; proxy_* factors explicitly named."""
from __future__ import annotations

from phase2.config import WEIGHTS


def score_bus_stops(count: int | None) -> tuple[float | None, bool]:
    if count is None:
        return None, False
    if count >= 3:
        return 10.0, True
    if count == 2:
        return 7.0, True
    if count == 1:
        return 5.0, True
    return 2.0, True


def score_police_distance(dist: float | None) -> tuple[float | None, bool]:
    if dist is None:
        return None, False
    if dist <= 300:
        return 10.0, True
    if dist <= 600:
        return 8.0, True
    if dist <= 1000:
        return 6.0, True
    if dist <= 2000:
        return 4.0, True
    return 2.0, True


def score_hospital_distance(dist: float | None) -> tuple[float | None, bool]:
    if dist is None:
        return None, False
    if dist <= 500:
        return 10.0, True
    if dist <= 1000:
        return 8.0, True
    if dist <= 2000:
        return 6.0, True
    if dist <= 3000:
        return 4.0, True
    return 2.0, True


def score_cctv(has_cctv: bool | None) -> tuple[float | None, bool]:
    if has_cctv is None:
        return None, False
    return (10.0 if has_cctv else 3.0), True


def score_lighting(
    lit_tag: str | None, highway: str, lamp_count: int | None
) -> tuple[float | None, bool, bool]:
    """Returns (score, observed, is_proxy)."""
    lit = (lit_tag or "").lower().strip()
    if lit == "yes":
        return 10.0, True, False
    if lit == "no":
        return 2.0, True, False
    # proxy from highway + lamps
    lamps = lamp_count or 0
    if highway in ("primary", "trunk"):
        return (8.0 if lamps > 2 else 6.0), True, True
    if highway in ("secondary", "tertiary"):
        return (7.0 if lamps > 1 else 5.0), True, True
    return (5.0 if lamps > 0 else 4.0), True, True


def proxy_crowd(highway: str) -> float:
    if highway in ("primary", "trunk"):
        return 8.0
    if highway == "secondary":
        return 7.0
    if highway == "tertiary":
        return 6.0
    if highway == "pedestrian":
        return 9.0
    return 5.0


def proxy_commercial(highway: str) -> float:
    if highway in ("primary", "trunk", "secondary"):
        return 8.0
    if highway in ("tertiary", "pedestrian"):
        return 7.0
    return 4.0


def proxy_night(highway: str, crowd: float) -> float:
    if highway in ("primary", "trunk"):
        return 8.0
    if highway == "secondary":
        return 6.0
    if crowd >= 7:
        return 7.0
    return 4.0


def score_road(surface: str | None, highway: str) -> tuple[float, bool]:
    """Returns (score, is_proxy)."""
    surf = (surface or "").lower().strip()
    good = {"asphalt", "concrete", "paved", "paving_stones"}
    bad = {"unpaved", "dirt", "gravel", "sand", "ground", "mud"}
    if surf in good:
        return 10.0, False
    if surf in bad:
        return 3.0, False
    if highway in ("primary", "trunk", "secondary"):
        return 8.0, True
    if highway == "tertiary":
        return 6.0, True
    return 5.0, True


def safety_level(score: float) -> str:
    if score >= 7:
        return "Safe"
    if score >= 4:
        return "Moderate"
    return "Unsafe"


def compute_row_scores(row: dict) -> dict:
    """
    row keys:
      highway, surface, lit,
      bus_count, police_dist_m, hospital_dist_m,
      has_cctv, lamp_count,
      cctv_within_100m, cctv_within_250m, cctv_within_500m, nearest_camera_m
    """
    hw = row.get("highway") or "residential"
    bus_s, bus_ok = score_bus_stops(row.get("bus_count"))
    pol_s, pol_ok = score_police_distance(row.get("police_dist_m"))
    hos_s, hos_ok = score_hospital_distance(row.get("hospital_dist_m"))
    cctv_s, cctv_ok = score_cctv(row.get("has_cctv"))
    lit_s, lit_ok, lit_proxy = score_lighting(row.get("lit"), hw, row.get("lamp_count"))
    crowd = proxy_crowd(hw)
    commercial = proxy_commercial(hw)
    night = proxy_night(hw, crowd)
    road_s, road_proxy = score_road(row.get("surface"), hw)

    parts = {
        "police": (pol_s, WEIGHTS["police"], pol_ok),
        "hospital": (hos_s, WEIGHTS["hospital"], hos_ok),
        "lighting": (lit_s, WEIGHTS["lighting"], lit_ok),
        "bus": (bus_s, WEIGHTS["bus"], bus_ok),
        "proxy_crowd": (crowd, WEIGHTS["proxy_crowd"], True),
        "cctv": (cctv_s, WEIGHTS["cctv"], cctv_ok),
        "road": (road_s, WEIGHTS["road"], True),
        "proxy_night": (night, WEIGHTS["proxy_night"], True),
        "proxy_commercial": (commercial, WEIGHTS["proxy_commercial"], True),
    }

    # If a measured factor is missing, redistribute its weight among observed factors
    observed_w = sum(w for s, w, ok in parts.values() if ok and s is not None)
    missing_w = sum(w for s, w, ok in parts.values() if not ok or s is None)
    total = 0.0
    for s, w, ok in parts.values():
        if not ok or s is None:
            continue
        share = w + (missing_w * (w / observed_w) if observed_w > 0 else 0)
        total += s * share

    # confidence: fraction of non-proxy measured factors that were observed
    measured_keys = ["police", "hospital", "lighting", "bus", "cctv", "road"]
    measured_ok = 0
    measured_n = 0
    proxy_flags = []
    for k in measured_keys:
        measured_n += 1
        s, w, ok = parts[k]
        if ok and s is not None:
            measured_ok += 1
        if k == "lighting" and lit_proxy:
            proxy_flags.append("lighting")
        if k == "road" and road_proxy:
            proxy_flags.append("road")
    proxy_flags.extend(["crowd", "night", "commercial"])  # always proxy

    confidence = round(measured_ok / measured_n, 3) if measured_n else 0.0
    score = round(total, 2)

    return {
        "infra_safety_score": score,
        "safety_level": safety_level(score),
        "confidence": confidence,
        "factor_police": pol_s,
        "factor_hospital": hos_s,
        "factor_lighting": lit_s,
        "factor_bus": bus_s,
        "factor_cctv": cctv_s,
        "factor_road": road_s,
        "proxy_crowd": crowd,
        "proxy_night": night,
        "proxy_commercial": commercial,
        "proxy_flags": ",".join(sorted(set(proxy_flags))),
        "lighting_is_proxy": lit_proxy,
        "road_is_proxy": road_proxy,
    }
