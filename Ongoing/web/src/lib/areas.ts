/**
 * BBMP area bounding boxes — synced from shared/areas.ts
 * Each bbox is [south, west, north, east].
 */

export type BBox = [south: number, west: number, north: number, east: number];

export const AREAS: Record<string, BBox> = {
  "MG Road": [12.973, 77.604, 12.979, 77.612],
  "Brigade Road": [12.971, 77.607, 12.976, 77.615],
  Indiranagar: [12.971, 77.638, 12.982, 77.65],
  Koramangala: [12.927, 77.619, 12.94, 77.632],
  Jayanagar: [12.924, 77.581, 12.938, 77.593],
  "JP Nagar": [12.897, 77.572, 12.912, 77.589],
  Banashankari: [12.911, 77.551, 12.927, 77.568],
  Basavanagudi: [12.938, 77.572, 12.95, 77.585],
  Malleshwaram: [13.002, 77.56, 13.015, 77.576],
  Rajajinagar: [12.988, 77.548, 13.006, 77.564],
  Vijayanagar: [12.969, 77.526, 12.985, 77.544],
  Yeshwanthpur: [13.018, 77.548, 13.036, 77.568],
  Hebbal: [13.038, 77.587, 13.057, 77.606],
  Yelahanka: [13.094, 77.578, 13.114, 77.602],
  Marathahalli: [12.953, 77.695, 12.968, 77.712],
  Whitefield: [12.967, 77.746, 12.987, 77.768],
  "Electronic City": [12.835, 77.668, 12.856, 77.69],
  "HSR Layout": [12.91, 77.64, 12.928, 77.658],
  "Sarjapur Road": [12.878, 77.668, 12.905, 77.692],
  Bellandur: [12.923, 77.67, 12.943, 77.692],
  "Outer Ring Road": [12.927, 77.69, 12.958, 77.73],
  "BTM Layout": [12.912, 77.61, 12.928, 77.628],
  "Wilson Garden": [12.947, 77.601, 12.958, 77.613],
  "Richmond Town": [12.959, 77.6, 12.97, 77.613],
  Shivajinagar: [12.982, 77.598, 12.994, 77.613],
  "Frazer Town": [12.983, 77.615, 12.995, 77.631],
  "Benson Town": [13.001, 77.611, 13.013, 77.628],
  "Cox Town": [12.987, 77.611, 13.0, 77.626],
  "Kalyan Nagar": [13.025, 77.638, 13.043, 77.658],
  "HBR Layout": [13.036, 77.638, 13.05, 77.654],
  Hennur: [13.038, 77.627, 13.058, 77.648],
  "RT Nagar": [13.02, 77.596, 13.04, 77.615],
  Mathikere: [13.021, 77.558, 13.04, 77.58],
  Peenya: [13.028, 77.515, 13.053, 77.54],
  "Tumkur Road": [13.042, 77.525, 13.07, 77.552],
  Nagarbhavi: [12.962, 77.508, 12.983, 77.53],
  Kengeri: [12.909, 77.486, 12.932, 77.513],
  "Mysore Road": [12.927, 77.505, 12.959, 77.532],
  "Rajarajeshwari Nagar": [12.905, 77.51, 12.928, 77.538],
  Uttarahalli: [12.888, 77.538, 12.913, 77.564],
  Begur: [12.87, 77.613, 12.898, 77.64],
  Bommanahalli: [12.888, 77.62, 12.913, 77.648],
  "Doddaballapur Road": [13.11, 77.573, 13.15, 77.61],
  Devanahalli: [13.232, 77.702, 13.27, 77.74],
  Hoskote: [13.068, 77.792, 13.11, 77.838],
  Anekal: [12.71, 77.683, 12.758, 77.728],
  Chandapura: [12.82, 77.668, 12.858, 77.708],
  Attibele: [12.768, 77.678, 12.81, 77.718],
  Vidyaranyapura: [13.072, 77.568, 13.1, 77.6],
  Dasarahalli: [13.056, 77.52, 13.087, 77.556],
  "Magadi Road": [12.967, 77.502, 12.995, 77.532],
  "Cubbon Park": [12.973, 77.592, 12.983, 77.608],
  "Church Street": [12.974, 77.607, 12.98, 77.618],
};

export const AREA_NAMES = Object.keys(AREAS).sort();

function bboxArea(bbox: BBox): number {
  const [s, w, n, e] = bbox;
  return Math.max(0, n - s) * Math.max(0, e - w);
}

export function matchArea(lat: number, lon: number): string | null {
  let best: { name: string; area: number } | null = null;
  for (const [name, bbox] of Object.entries(AREAS)) {
    const [s, w, n, e] = bbox;
    if (lat >= s && lat <= n && lon >= w && lon <= e) {
      const a = bboxArea(bbox);
      if (!best || a < best.area) best = { name, area: a };
    }
  }
  return best?.name ?? null;
}

export async function reverseGeocodeArea(
  lat: number,
  lon: number
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SafeHer-Bengaluru/1.0 (academic PBL)",
      },
    });
    if (!res.ok) return "Unknown Area";
    const data = (await res.json()) as {
      address?: Record<string, string>;
    };
    const a = data.address ?? {};
    return (
      a.suburb ||
      a.neighbourhood ||
      a.city_district ||
      a.town ||
      a.village ||
      a.city ||
      "Unknown Area"
    );
  } catch {
    return "Unknown Area";
  }
}

export async function resolveArea(lat: number, lon: number): Promise<string> {
  const matched = matchArea(lat, lon);
  if (matched) return matched;
  return reverseGeocodeArea(lat, lon);
}

export function getTimeOfDay(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}
