import { Linking } from "react-native";

export interface Helpline {
  id: string;
  name: string;
  number: string;
  description: string;
  priority: "critical" | "high" | "normal";
}

/** India / Bengaluru emergency & women safety helplines (for dialing via the phone). */
export const HELPLINES: Helpline[] = [
  {
    id: "112",
    name: "National Emergency",
    number: "112",
    description: "Police · Fire · Ambulance — all-in-one emergency",
    priority: "critical",
  },
  {
    id: "1091",
    name: "Women Helpline",
    number: "1091",
    description: "24×7 women in distress helpline",
    priority: "critical",
  },
  {
    id: "100",
    name: "Police",
    number: "100",
    description: "Local police emergency line",
    priority: "critical",
  },
  {
    id: "181",
    name: "Women Helpline (state)",
    number: "181",
    description: "State women helpline / support services",
    priority: "high",
  },
  {
    id: "1098",
    name: "Childline",
    number: "1098",
    description: "For children in need of care & protection",
    priority: "high",
  },
  {
    id: "108",
    name: "Ambulance",
    number: "108",
    description: "Emergency medical / ambulance services",
    priority: "high",
  },
  {
    id: "1090",
    name: "Women Power Line",
    number: "1090",
    description: "Harassment / eve-teasing related help (where available)",
    priority: "normal",
  },
];

export function mapsLink(lat: number, lon: number): string {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

/** Prefer native maps / OSM so opening works even without Google Maps app. */
export async function openMapsAt(
  lat: number,
  lon: number
): Promise<void> {
  const candidates = [
    `geo:${lat},${lon}?q=${lat},${lon}(SafeHer)`,
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
    mapsLink(lat, lon),
  ];
  for (const url of candidates) {
    try {
      await Linking.openURL(url);
      return;
    } catch {
      // try next
    }
  }
}

export function emergencyShareMessage(
  lat: number,
  lon: number,
  area?: string | null
): string {
  const link = mapsLink(lat, lon);
  const areaLine = area ? `Area: ${area}\n` : "";
  return (
    `EMERGENCY — I need help.\n` +
    `${areaLine}` +
    `Live location: ${link}\n` +
    `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}\n` +
    `Sent via SafeHer.`
  );
}
