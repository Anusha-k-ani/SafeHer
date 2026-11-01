import type { LocationFix } from "./domain";
import { formatLocation } from "./domain";

type NominatimAddress = {
  road?: string;
  pedestrian?: string;
  footway?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
};

const cache = new Map<string, LocationFix>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

function first(...values: (string | undefined)[]): string | null {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return null;
}

export async function enrichPlace(base: LocationFix): Promise<LocationFix> {
  if (base.latitude == null || base.longitude == null) {
    return { ...base, geocode_status: "skipped", display_name: formatLocation(base) };
  }
  if (process.env.SURAKSHA_SKIP_GEOCODE === "1") {
    return { ...base, geocode_status: "skipped", display_name: formatLocation({ ...base, state: base.state ?? "Karnataka" }) };
  }
  const key = cacheKey(base.latitude, base.longitude);
  const hit = cache.get(key);
  if (hit) return { ...base, ...hit, latitude: base.latitude, longitude: base.longitude, district: hit.district || base.district };

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(base.latitude));
    url.searchParams.set("lon", String(base.longitude));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url, {
      headers: { "User-Agent": "SurakshaSetu/1.0 (academic local demo; no commercial use)" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) {
      return { ...base, geocode_status: "unavailable", display_name: formatLocation({ ...base, state: "Karnataka" }) };
    }
    const pack = (await res.json()) as NominatimResponse;
    const address = pack.address || {};
    const street = first(address.road, address.pedestrian, address.footway);
    const locality = first(address.neighbourhood, address.suburb);
    const area = first(address.city_district, address.city, address.town, address.village);
    const district = first(address.county, address.state_district, base.district || undefined);
    const state = first(address.state) || "Karnataka";
    const next: LocationFix = {
      ...base,
      street_name: street || base.street_name,
      locality,
      area,
      district: district || base.district,
      state,
      geocode_status: street || locality || area ? "resolved" : "partial",
      display_name: null,
      note: street
        ? `Place name from OpenStreetMap Nominatim. Coordinates are stored separately.`
        : base.note,
    };
    next.display_name = formatLocation(next);
    cache.set(key, next);
    return next;
  } catch {
    return { ...base, geocode_status: "unavailable", display_name: formatLocation({ ...base, state: "Karnataka" }) };
  }
}
