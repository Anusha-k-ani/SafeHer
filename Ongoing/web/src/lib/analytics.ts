import type { AreaSummary } from "./types";
import {
  communityLevel,
  communityScore,
  type AreaSafety,
  type SafetyReport,
} from "./reports";

export interface DashboardAnalytics {
  totalReports: number;
  safeReports: number;
  unsafeReports: number;
  pctSafe: number;
  avgRating: number | null;
  areasCovered: number;
  syntheticReports: number;
  liveReports: number;
  overallScore: number;
  overallLevel: "Safe" | "Moderate" | "Unsafe";
  safeUnsafe: { name: string; value: number; color: string }[];
  timeOfDay: { name: string; safe: number; unsafe: number; total: number }[];
  ratingDist: { rating: string; count: number }[];
  factorRates: { name: string; pct: number; count: number; total: number }[];
  sourceSplit: { name: string; value: number; color: string }[];
  topSafest: AreaSafetyRank[];
  topUnsafe: AreaSafetyRank[];
  topVolume: AreaSafetyRank[];
  osmVsCommunity: {
    area: string;
    osmScore: number;
    communityScore: number;
    reports: number;
  }[];
  areaLevels: { name: string; value: number; color: string }[];
}

export interface AreaSafetyRank extends AreaSafety {
  score: number;
  level: "Safe" | "Moderate" | "Unsafe";
}

const TOD_ORDER = ["morning", "afternoon", "evening", "night"] as const;

function pct(n: number, d: number): number {
  if (d === 0) return 0;
  return Math.round((1000 * n) / d) / 10;
}

export function buildDashboardAnalytics(
  reports: SafetyReport[],
  areas: AreaSafety[],
  osmAreas: AreaSummary[] = []
): DashboardAnalytics {
  const totalReports = reports.length;
  const safeReports = reports.filter((r) => r.is_safe).length;
  const unsafeReports = totalReports - safeReports;
  const syntheticReports = reports.filter((r) => r.is_synthetic).length;
  const liveReports = totalReports - syntheticReports;

  const ratings = reports
    .map((r) => r.safety_rating)
    .filter((r): r is number => r != null);
  const avgRating =
    ratings.length === 0
      ? null
      : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) /
        100;

  const pctSafe = pct(safeReports, totalReports);
  const overallScore = communityScore(pctSafe, avgRating);
  const overallLevel = communityLevel(overallScore);

  const ranked: AreaSafetyRank[] = areas.map((a) => {
    const score = communityScore(Number(a.pct_safe), a.avg_rating);
    return { ...a, score, level: communityLevel(score) };
  });

  const todMap = new Map<string, { safe: number; unsafe: number }>();
  for (const t of TOD_ORDER) todMap.set(t, { safe: 0, unsafe: 0 });
  for (const r of reports) {
    const key = (r.time_of_day ?? "afternoon").toLowerCase();
    const bucket = todMap.get(key) ?? { safe: 0, unsafe: 0 };
    if (r.is_safe) bucket.safe += 1;
    else bucket.unsafe += 1;
    todMap.set(key, bucket);
  }

  const ratingCounts = [0, 0, 0, 0, 0];
  for (const r of ratings) {
    const i = Math.min(5, Math.max(1, Math.round(r))) - 1;
    ratingCounts[i] += 1;
  }

  function factorPct(
    pick: (r: SafetyReport) => boolean | null | undefined
  ): { pct: number; count: number; total: number } {
    let count = 0;
    let total = 0;
    for (const r of reports) {
      const v = pick(r);
      if (v == null) continue;
      total += 1;
      if (v) count += 1;
    }
    return { pct: pct(count, total), count, total };
  }

  const lighting = factorPct((r) => r.lighting_ok);
  const police = factorPct((r) => r.police_nearby);
  const cctv = factorPct((r) => r.cctv_seen);
  const transport = factorPct((r) => r.transport_nearby);
  const harassment = factorPct((r) => r.harassment_reported);

  const osmByArea = new Map(osmAreas.map((a) => [a.Area, a.Avg_Safety_Score]));
  const osmVsCommunity = ranked
    .filter((a) => osmByArea.has(a.area) && a.report_count >= 3)
    .map((a) => ({
      area: a.area.length > 12 ? a.area.slice(0, 11) + "…" : a.area,
      fullArea: a.area,
      osmScore: osmByArea.get(a.area) ?? 0,
      communityScore: a.score,
      reports: a.report_count,
    }))
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 15)
    .map(({ fullArea: _f, ...rest }) => rest);

  const levelCounts = { Safe: 0, Moderate: 0, Unsafe: 0 };
  for (const a of ranked) levelCounts[a.level] += 1;

  return {
    totalReports,
    safeReports,
    unsafeReports,
    pctSafe,
    avgRating,
    areasCovered: areas.length,
    syntheticReports,
    liveReports,
    overallScore,
    overallLevel,
    safeUnsafe: [
      { name: "Safe", value: safeReports, color: "#0E9F6E" },
      { name: "Unsafe", value: unsafeReports, color: "#E02424" },
    ],
    timeOfDay: TOD_ORDER.map((name) => {
      const b = todMap.get(name) ?? { safe: 0, unsafe: 0 };
      return {
        name: name[0].toUpperCase() + name.slice(1),
        safe: b.safe,
        unsafe: b.unsafe,
        total: b.safe + b.unsafe,
      };
    }),
    ratingDist: ratingCounts.map((count, i) => ({
      rating: `${i + 1}★`,
      count,
    })),
    factorRates: [
      { name: "Good lighting", ...lighting },
      { name: "Police nearby", ...police },
      { name: "CCTV seen", ...cctv },
      { name: "Transport nearby", ...transport },
      { name: "Harassment flagged", ...harassment },
    ],
    sourceSplit: [
      { name: "Synthetic", value: syntheticReports, color: "#7C3AED" },
      { name: "Live users", value: liveReports, color: "#0E9F6E" },
    ],
    topSafest: [...ranked]
      .filter((a) => a.report_count >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8),
    topUnsafe: [...ranked]
      .filter((a) => a.report_count >= 4)
      .sort((a, b) => a.score - b.score)
      .slice(0, 8),
    topVolume: [...ranked].sort((a, b) => b.report_count - a.report_count).slice(0, 12),
    osmVsCommunity,
    areaLevels: [
      { name: "Safe areas", value: levelCounts.Safe, color: "#0E9F6E" },
      { name: "Moderate", value: levelCounts.Moderate, color: "#D97706" },
      { name: "Unsafe areas", value: levelCounts.Unsafe, color: "#E02424" },
    ],
  };
}
