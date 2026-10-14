import type {
  AreaSummary,
  SafetyLevel,
  Street,
  StreetMapPoint,
  SummaryData,
} from "./types";

const DATA_BASE = "/data";

let streetsCache: Street[] | null = null;
let areasCache: AreaSummary[] | null = null;
let summaryCache: SummaryData | null = null;

export async function loadStreets(): Promise<Street[]> {
  if (streetsCache) return streetsCache;
  const res = await fetch(`${DATA_BASE}/streets.json`);
  if (!res.ok) {
    streetsCache = [];
    return streetsCache;
  }
  streetsCache = (await res.json()) as Street[];
  return streetsCache;
}

export async function loadAreas(): Promise<AreaSummary[]> {
  if (areasCache) return areasCache;
  const res = await fetch(`${DATA_BASE}/areas.json`);
  if (!res.ok) throw new Error("Failed to load areas data");
  areasCache = (await res.json()) as AreaSummary[];
  return areasCache;
}

export async function loadSummary(): Promise<SummaryData> {
  if (summaryCache) return summaryCache;
  const res = await fetch(`${DATA_BASE}/summary.json`);
  if (!res.ok) throw new Error("Failed to load summary data");
  summaryCache = (await res.json()) as SummaryData;
  return summaryCache;
}

export async function loadMapPoints(): Promise<StreetMapPoint[]> {
  const res = await fetch(`${DATA_BASE}/streets.min.json`);
  if (!res.ok) return [];
  return (await res.json()) as StreetMapPoint[];
}

export function searchStreets(
  streets: Street[],
  query: string,
  limit = 100
): Street[] {
  const q = query.trim().toLowerCase();
  if (!q) return streets.slice(0, limit);

  return streets
    .filter(
      (s) =>
        s.Street_Name.toLowerCase().includes(q) ||
        s.Street_ID.toLowerCase().includes(q) ||
        s.Area.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

export function filterStreets(
  streets: Street[],
  filters: {
    areas?: string[];
    levels?: SafetyLevel[];
    minScore?: number;
    maxScore?: number;
    cctvOnly?: boolean;
    minBusStops?: number;
  }
): Street[] {
  return streets.filter((s) => {
    if (filters.areas?.length && !filters.areas.includes(s.Area)) return false;
    if (filters.levels?.length && !filters.levels.includes(s.Safety_Level))
      return false;
    if (filters.minScore !== undefined && s.Safety_Score < filters.minScore)
      return false;
    if (filters.maxScore !== undefined && s.Safety_Score > filters.maxScore)
      return false;
    if (filters.cctvOnly && s.CCTV !== 1) return false;
    if (
      filters.minBusStops !== undefined &&
      s.Bus_Stop_Count < filters.minBusStops
    )
      return false;
    return true;
  });
}

export function filterMapPoints(
  points: StreetMapPoint[],
  filters: {
    areas?: string[];
    levels?: SafetyLevel[];
    minScore?: number;
    maxScore?: number;
    cctvOnly?: boolean;
    minBusStops?: number;
  },
  streetLookup?: Map<string, Street>
): StreetMapPoint[] {
  return points.filter((p) => {
    if (filters.areas?.length && !filters.areas.includes(p.area)) return false;
    if (filters.levels?.length && !filters.levels.includes(p.level)) return false;
    if (filters.minScore !== undefined && p.score < filters.minScore)
      return false;
    if (filters.maxScore !== undefined && p.score > filters.maxScore)
      return false;
    if (filters.cctvOnly || filters.minBusStops !== undefined) {
      const street = streetLookup?.get(p.id);
      if (!street) return true;
      if (filters.cctvOnly && street.CCTV !== 1) return false;
      if (
        filters.minBusStops !== undefined &&
        street.Bus_Stop_Count < filters.minBusStops
      )
        return false;
    }
    return true;
  });
}

export function sortStreets<T extends Street>(
  streets: T[],
  key: keyof Street,
  direction: "asc" | "desc"
): T[] {
  return [...streets].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "number" && typeof bv === "number") {
      return direction === "asc" ? av - bv : bv - av;
    }
    const as = String(av).toLowerCase();
    const bs = String(bv).toLowerCase();
    if (as < bs) return direction === "asc" ? -1 : 1;
    if (as > bs) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

export function getUniqueAreas(streets: Street[]): string[] {
  return [...new Set(streets.map((s) => s.Area))].sort();
}

export function findStreetById(
  streets: Street[],
  id: string
): Street | undefined {
  return streets.find((s) => s.Street_ID === id);
}

export function pct(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}
