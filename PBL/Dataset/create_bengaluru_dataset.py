"""
Bengaluru Street Safety Dataset Creator
Fetches real infrastructure data from OpenStreetMap via Overpass API.
Covers all BBMP areas, computes genuine safety scores per the project guide.
"""

import requests
import pandas as pd
import math
import time
import json
import sys
from datetime import datetime

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
HEADERS = {"User-Agent": "BengaluruStreetSafetyResearch/1.0 (academic project)"}
OUTPUT_FILE = r"C:\aman\dataset for pbl\bengaluru_street_safety_REAL.xlsx"

# ---------------------------------------------------------------------------
# 53 BBMP areas with bounding boxes  [south, west, north, east]
# ---------------------------------------------------------------------------
AREAS = {
    "MG Road":              [12.9730, 77.6040, 12.9790, 77.6120],
    "Brigade Road":         [12.9710, 77.6070, 12.9760, 77.6150],
    "Indiranagar":          [12.9710, 77.6380, 12.9820, 77.6500],
    "Koramangala":          [12.9270, 77.6190, 12.9400, 77.6320],
    "Jayanagar":            [12.9240, 77.5810, 12.9380, 77.5930],
    "JP Nagar":             [12.8970, 77.5720, 12.9120, 77.5890],
    "Banashankari":         [12.9110, 77.5510, 12.9270, 77.5680],
    "Basavanagudi":         [12.9380, 77.5720, 12.9500, 77.5850],
    "Malleshwaram":         [13.0020, 77.5600, 13.0150, 77.5760],
    "Rajajinagar":          [12.9880, 77.5480, 13.0060, 77.5640],
    "Vijayanagar":          [12.9690, 77.5260, 12.9850, 77.5440],
    "Yeshwanthpur":         [13.0180, 77.5480, 13.0360, 77.5680],
    "Hebbal":               [13.0380, 77.5870, 13.0570, 77.6060],
    "Yelahanka":            [13.0940, 77.5780, 13.1140, 77.6020],
    "Marathahalli":         [12.9530, 77.6950, 12.9680, 77.7120],
    "Whitefield":           [12.9670, 77.7460, 12.9870, 77.7680],
    "Electronic City":      [12.8350, 77.6680, 12.8560, 77.6900],
    "HSR Layout":           [12.9100, 77.6400, 12.9280, 77.6580],
    "Sarjapur Road":        [12.8780, 77.6680, 12.9050, 77.6920],
    "Bellandur":            [12.9230, 77.6700, 12.9430, 77.6920],
    "Outer Ring Road":      [12.9270, 77.6900, 12.9580, 77.7300],
    "BTM Layout":           [12.9120, 77.6100, 12.9280, 77.6280],
    "Wilson Garden":        [12.9470, 77.6010, 12.9580, 77.6130],
    "Richmond Town":        [12.9590, 77.6000, 12.9700, 77.6130],
    "Shivajinagar":         [12.9820, 77.5980, 12.9940, 77.6130],
    "Frazer Town":          [12.9830, 77.6150, 12.9950, 77.6310],
    "Benson Town":          [13.0010, 77.6110, 13.0130, 77.6280],
    "Cox Town":             [12.9870, 77.6110, 13.0000, 77.6260],
    "Kalyan Nagar":         [13.0250, 77.6380, 13.0430, 77.6580],
    "HBR Layout":           [13.0360, 77.6380, 13.0500, 77.6540],
    "Hennur":               [13.0380, 77.6270, 13.0580, 77.6480],
    "RT Nagar":             [13.0200, 77.5960, 13.0400, 77.6150],
    "Mathikere":            [13.0210, 77.5580, 13.0400, 77.5800],
    "Peenya":               [13.0280, 77.5150, 13.0530, 77.5400],
    "Tumkur Road":          [13.0420, 77.5250, 13.0700, 77.5520],
    "Nagarbhavi":           [12.9620, 77.5080, 12.9830, 77.5300],
    "Kengeri":              [12.9090, 77.4860, 12.9320, 77.5130],
    "Mysore Road":          [12.9270, 77.5050, 12.9590, 77.5320],
    "Rajarajeshwari Nagar": [12.9050, 77.5100, 12.9280, 77.5380],
    "Uttarahalli":          [12.8880, 77.5380, 12.9130, 77.5640],
    "Begur":                [12.8700, 77.6130, 12.8980, 77.6400],
    "Bommanahalli":         [12.8880, 77.6200, 12.9130, 77.6480],
    "Doddaballapur Road":   [13.1100, 77.5730, 13.1500, 77.6100],
    "Devanahalli":          [13.2320, 77.7020, 13.2700, 77.7400],
    "Hoskote":              [13.0680, 77.7920, 13.1100, 77.8380],
    "Anekal":               [12.7100, 77.6830, 12.7580, 77.7280],
    "Chandapura":           [12.8200, 77.6680, 12.8580, 77.7080],
    "Attibele":             [12.7680, 77.6780, 12.8100, 77.7180],
    "Vidyaranyapura":       [13.0720, 77.5680, 13.1000, 77.6000],
    "Dasarahalli":          [13.0560, 77.5200, 13.0870, 77.5560],
    "Magadi Road":          [12.9670, 77.5020, 12.9950, 77.5320],
    "Cubbon Park":          [12.9730, 77.5920, 12.9830, 77.6080],
    "Church Street":        [12.9740, 77.6070, 12.9800, 77.6180],
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def overpass_query(query, retries=4):
    for attempt in range(retries):
        try:
            resp = requests.post(
                OVERPASS_URL,
                data={"data": query},
                headers=HEADERS,
                timeout=90
            )
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                wait = 30 * (attempt + 1)
                print(f"    Rate limited — waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"    HTTP {resp.status_code} — retry {attempt+1}")
                time.sleep(10)
        except requests.exceptions.Timeout:
            print(f"    Timeout on attempt {attempt+1}, retrying...")
            time.sleep(15)
        except Exception as e:
            print(f"    Error: {e}, retry {attempt+1}")
            time.sleep(10)
    return None


def node_centroid(element):
    if element["type"] == "node":
        return element["lat"], element["lon"]
    if element["type"] == "way" and "geometry" in element:
        lats = [p["lat"] for p in element["geometry"]]
        lons = [p["lon"] for p in element["geometry"]]
        return sum(lats)/len(lats), sum(lons)/len(lons)
    if "center" in element:
        return element["center"]["lat"], element["center"]["lon"]
    return None, None

# ---------------------------------------------------------------------------
# Per-area data fetchers
# ---------------------------------------------------------------------------

def fetch_streets(bbox):
    s, w, n, e = bbox
    query = f"""
[out:json][timeout:60];
(
  way["highway"~"^(primary|secondary|tertiary|residential|unclassified|trunk|living_street|pedestrian)$"]({s},{w},{n},{e});
);
out center geom;
"""
    data = overpass_query(query)
    if not data:
        return []
    streets = []
    for el in data.get("elements", []):
        lat, lon = node_centroid(el)
        if lat is None:
            continue
        tags = el.get("tags", {})
        streets.append({
            "osm_id": el["id"],
            "name": tags.get("name", tags.get("ref", f"Street_{el['id']}")),
            "lat": lat,
            "lon": lon,
            "highway": tags.get("highway", "residential"),
            "surface": tags.get("surface", ""),
            "lit": tags.get("lit", ""),
        })
    return streets


def fetch_pois(bbox, poi_type):
    """Fetch nodes/ways of a specific type within bbox."""
    s, w, n, e = bbox
    if poi_type == "bus_stop":
        filter_str = '["highway"="bus_stop"]'
        filter_str2 = '["public_transport"="stop_position"]'
        query = f"""
[out:json][timeout:60];
(
  node{filter_str}({s},{w},{n},{e});
  node{filter_str2}({s},{w},{n},{e});
);
out center;
"""
    elif poi_type == "police":
        query = f"""
[out:json][timeout:60];
(
  node["amenity"="police"]({s},{w},{n},{e});
  way["amenity"="police"]({s},{w},{n},{e});
);
out center;
"""
    elif poi_type == "hospital":
        query = f"""
[out:json][timeout:60];
(
  node["amenity"~"hospital|clinic|doctors"]({s},{w},{n},{e});
  way["amenity"~"hospital|clinic|doctors"]({s},{w},{n},{e});
);
out center;
"""
    elif poi_type == "cctv":
        query = f"""
[out:json][timeout:60];
(
  node["man_made"="surveillance"]({s},{w},{n},{e});
  node["surveillance:type"="camera"]({s},{w},{n},{e});
);
out center;
"""
    elif poi_type == "lamp":
        query = f"""
[out:json][timeout:60];
(
  node["highway"="street_lamp"]({s},{w},{n},{e});
);
out center;
"""
    else:
        return []

    data = overpass_query(query)
    if not data:
        return []
    points = []
    for el in data.get("elements", []):
        lat, lon = node_centroid(el)
        if lat:
            points.append((lat, lon))
    return points


def expand_bbox(bbox, km=5):
    """Expand bbox by km in all directions to catch nearby facilities."""
    s, w, n, e = bbox
    delta_lat = km / 111.0
    delta_lon = km / (111.0 * math.cos(math.radians((s+n)/2)))
    return [s - delta_lat, w - delta_lon, n + delta_lat, e + delta_lon]


def nearest_distance(street_lat, street_lon, poi_list):
    if not poi_list:
        return 5000  # default 5 km if none found
    return min(haversine(street_lat, street_lon, p[0], p[1]) for p in poi_list)


def count_within_radius(street_lat, street_lon, poi_list, radius=500):
    return sum(1 for p in poi_list if haversine(street_lat, street_lon, p[0], p[1]) <= radius)

# ---------------------------------------------------------------------------
# Safety scoring  (follows project guide Section 14)
# ---------------------------------------------------------------------------

def score_bus_stops(count):
    if count >= 3: return 10
    if count == 2: return 7
    if count == 1: return 5
    return 2

def score_police_distance(dist):
    if dist <= 300:  return 10
    if dist <= 600:  return 8
    if dist <= 1000: return 6
    if dist <= 2000: return 4
    return 2

def score_hospital_distance(dist):
    if dist <= 500:  return 10
    if dist <= 1000: return 8
    if dist <= 2000: return 6
    if dist <= 3000: return 4
    return 2

def score_cctv(has_cctv):
    return 10 if has_cctv else 3

def score_lighting(lit_tag, highway, lamp_count):
    if lit_tag == "yes": return 10
    if lit_tag == "no":  return 2
    # infer from highway type + lamp count
    if highway in ("primary", "trunk"):      return 8 if lamp_count > 2 else 6
    if highway in ("secondary", "tertiary"): return 7 if lamp_count > 1 else 5
    return 5 if lamp_count > 0 else 4

def score_crowd(highway):
    if highway in ("primary", "trunk"):      return 8
    if highway in ("secondary"):             return 7
    if highway in ("tertiary"):              return 6
    if highway in ("pedestrian"):            return 9
    return 5

def score_commercial(highway):
    if highway in ("primary", "trunk", "secondary"): return 8
    if highway in ("tertiary", "pedestrian"):        return 7
    return 4

def score_night_activity(highway, crowd):
    if highway in ("primary", "trunk"):  return 8
    if highway in ("secondary"):         return 6
    if crowd >= 7:                       return 7
    return 4

def score_road_condition(surface, highway):
    good = {"asphalt", "concrete", "paved"}
    bad  = {"unpaved", "dirt", "gravel", "sand"}
    if surface in good:              return 10
    if surface in bad:               return 3
    if highway in ("primary","trunk","secondary"): return 8
    if highway in ("tertiary"):      return 6
    return 5

def compute_safety_score(row):
    weights = {
        "bus":      0.15,
        "police":   0.20,
        "hospital": 0.15,
        "cctv":     0.10,
        "lighting": 0.15,
        "crowd":    0.10,
        "commercial":0.05,
        "night":    0.05,
        "road":     0.05,
    }
    score = (
        score_bus_stops(row["bus_count"])          * weights["bus"]      +
        score_police_distance(row["police_dist"])  * weights["police"]   +
        score_hospital_distance(row["hosp_dist"])  * weights["hospital"] +
        score_cctv(row["has_cctv"])                * weights["cctv"]     +
        row["lighting_score"]                      * weights["lighting"] +
        row["crowd_score"]                         * weights["crowd"]    +
        row["commercial_score"]                    * weights["commercial"]+
        row["night_score"]                         * weights["night"]    +
        row["road_score"]                          * weights["road"]
    )
    return round(score, 2)

def safety_level(score):
    if score >= 7: return "Safe"
    if score >= 4: return "Moderate"
    return "Unsafe"

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------

def process_area(area_name, bbox):
    print(f"\n{'='*60}")
    print(f"  Processing: {area_name}")
    print(f"{'='*60}")

    print("  Fetching streets...")
    streets = fetch_streets(bbox)
    print(f"  -> {len(streets)} streets found")
    if not streets:
        return []

    # Expand bbox for nearby facilities
    exp = expand_bbox(bbox, km=5)

    print("  Fetching bus stops...")
    bus_stops = fetch_pois(exp, "bus_stop")
    time.sleep(2)

    print("  Fetching police stations...")
    police = fetch_pois(exp, "police")
    time.sleep(2)

    print("  Fetching hospitals/clinics...")
    hospitals = fetch_pois(exp, "hospital")
    time.sleep(2)

    print("  Fetching CCTV cameras...")
    cctv_nodes = fetch_pois(exp, "cctv")
    time.sleep(2)

    print("  Fetching street lamps...")
    lamps = fetch_pois(exp, "lamp")
    time.sleep(2)

    print(f"  POIs — bus:{len(bus_stops)} police:{len(police)} hospital:{len(hospitals)} cctv:{len(cctv_nodes)} lamps:{len(lamps)}")

    rows = []
    for i, st in enumerate(streets):
        lat, lon = st["lat"], st["lon"]
        hw  = st["highway"]
        lit = st["lit"]
        surf= st["surface"]

        bus_count   = count_within_radius(lat, lon, bus_stops, 500)
        police_dist = nearest_distance(lat, lon, police)
        hosp_dist   = nearest_distance(lat, lon, hospitals)
        near_cctv   = count_within_radius(lat, lon, cctv_nodes, 300) > 0
        near_lamps  = count_within_radius(lat, lon, lamps, 300)

        l_score  = score_lighting(lit, hw, near_lamps)
        c_score  = score_crowd(hw)
        co_score = score_commercial(hw)
        n_score  = score_night_activity(hw, c_score)
        r_score  = score_road_condition(surf, hw)

        intermediate = {
            "bus_count":       bus_count,
            "police_dist":     police_dist,
            "hosp_dist":       hosp_dist,
            "has_cctv":        near_cctv,
            "lighting_score":  l_score,
            "crowd_score":     c_score,
            "commercial_score":co_score,
            "night_score":     n_score,
            "road_score":      r_score,
        }
        safety = compute_safety_score(intermediate)

        rows.append({
            "Street_ID":            f"BLR_{area_name[:3].upper()}_{i+1:04d}",
            "Street_Name":          st["name"],
            "Area":                 area_name,
            "Latitude":             round(lat, 6),
            "Longitude":            round(lon, 6),
            "Bus_Stop_Count":       bus_count,
            "Police_Distance_m":    round(police_dist),
            "Hospital_Distance_m":  round(hosp_dist),
            "CCTV":                 1 if near_cctv else 0,
            "Lighting":             l_score,
            "Crowd_Level":          c_score,
            "Commercial_Area":      co_score,
            "Night_Activity":       n_score,
            "Road_Condition":       r_score,
            "Safety_Score":         safety,
            "Safety_Level":         safety_level(safety),
        })

    print(f"  -> {len(rows)} records built for {area_name}")
    return rows


def main():
    all_rows = []
    total = len(AREAS)
    failed = []

    for idx, (area_name, bbox) in enumerate(AREAS.items(), 1):
        print(f"\n[{idx}/{total}]", end="")
        try:
            rows = process_area(area_name, bbox)
            all_rows.extend(rows)
        except Exception as e:
            print(f"  ERROR in {area_name}: {e}")
            failed.append(area_name)
        # Polite delay between areas
        time.sleep(5)

    if not all_rows:
        print("\nNo data collected. Check your internet connection.")
        sys.exit(1)

    df = pd.DataFrame(all_rows)
    df["Street_ID"] = [f"BLR_{i+1:05d}" for i in range(len(df))]

    # Summary stats
    print(f"\n{'='*60}")
    print(f"TOTAL STREETS : {len(df)}")
    print(f"AREAS COVERED : {df['Area'].nunique()}")
    print(df["Safety_Level"].value_counts().to_string())
    print(f"AVG SCORE     : {df['Safety_Score'].mean():.2f}")
    if failed:
        print(f"FAILED AREAS  : {failed}")

    # Area summary
    area_summary = df.groupby("Area").agg(
        Street_Count=("Street_Name", "count"),
        Avg_Safety_Score=("Safety_Score", "mean"),
        Safe=("Safety_Level", lambda x: (x=="Safe").sum()),
        Moderate=("Safety_Level", lambda x: (x=="Moderate").sum()),
        Unsafe=("Safety_Level", lambda x: (x=="Unsafe").sum()),
    ).round(2).reset_index()

    # Distribution cross-tab
    dist = pd.crosstab(df["Area"], df["Safety_Level"])

    # Write Excel
    with pd.ExcelWriter(OUTPUT_FILE, engine="openpyxl") as writer:
        df.to_excel(writer, sheet_name="Street Safety Dataset", index=False)
        area_summary.to_excel(writer, sheet_name="Area Summary", index=False)
        dist.to_excel(writer, sheet_name="Safety Distribution")
        pd.DataFrame({
            "Metric": ["Total Streets","Areas Covered","Safe","Moderate","Unsafe","Avg Safety Score","Generated On"],
            "Value":  [
                len(df), df["Area"].nunique(),
                (df["Safety_Level"]=="Safe").sum(),
                (df["Safety_Level"]=="Moderate").sum(),
                (df["Safety_Level"]=="Unsafe").sum(),
                round(df["Safety_Score"].mean(),2),
                datetime.now().strftime("%Y-%m-%d %H:%M"),
            ]
        }).to_excel(writer, sheet_name="Summary", index=False)

    print(f"\nDataset saved to:\n  {OUTPUT_FILE}")
    print("Done!")


if __name__ == "__main__":
    main()
