# Phase 2 Data Dictionary — Karnataka streets

## Street row (`karnataka_streets.parquet` / district Excel)

| Column | Type | Meaning |
|--------|------|---------|
| street_id | string | Stable id `KA_{district_code}_{osm_way_id}` |
| osm_way_id | int | OSM way id (ground truth geometry id) |
| street_name | string | OSM `name` or `ref` or `way/{id}` |
| district_name | string | Karnataka district from polygon join |
| district_code | string | Census/district code from boundary file |
| state | string | Always `Karnataka` |
| latitude, longitude | float | Way centroid |
| highway | string | OSM highway class |
| surface | string\|null | OSM surface tag if present |
| lit | string\|null | OSM lit tag if present |
| service_flagged | bool | True when highway=service |
| bus_stop_count | int | OSM bus stops within 500 m |
| police_distance_m | float\|null | Metres to nearest OSM police amenity |
| hospital_distance_m | float\|null | Metres to nearest hospital/clinic/doctors |
| lamp_count_300m | int | Street lamps within 300 m |
| cctv_within_100m/250m/500m | int | OSM (+official) cameras in radius |
| nearest_camera_m | float\|null | Distance to nearest camera |
| camera_sources | string | e.g. `osm` or `osm,official` |
| infra_safety_score | float | Weighted 0–10 infrastructure score |
| safety_level | string | Safe ≥7 / Moderate ≥4 / Unsafe &lt;4 |
| confidence | float | 0–1 share of measured factors observed |
| factor_* | float\|null | Per-factor sub-scores |
| proxy_crowd / proxy_night / proxy_commercial | float | Explicitly proxy (highway-derived) |
| proxy_flags | string | Comma list of proxy factor names |
| lighting_is_proxy / road_is_proxy | bool | True when tag missing and inferred |
| data_source | string | Provenance |
| as_of | string | Extract date UTC |

## Camera row

| Column | Meaning |
|--------|---------|
| camera_id | `osm_node_{id}` or `official_{id}` |
| latitude, longitude | WGS84 |
| source | `osm` or `official` |
| district_name / district_code | From district join when available |
| tags | OSM tags or official metadata JSON |

## Weights (unchanged totals = 1.0)

Police 20%, Hospital 15%, Lighting 15%, Bus 15%, proxy_crowd 10%, CCTV 10%, Road 5%, proxy_night 5%, proxy_commercial 5%.
