import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTimeOfDay } from "./areas";
import type { IncidentType, ReportKind } from "./incidents";
import { isSupabaseConfigured, supabase } from "./supabase";

// Bundled synthetic demo data (aligned with OSM area scores)
import syntheticJson from "@/assets/data/community-synthetic.json";

export interface SafetyReport {
  id: string;
  created_at: string;
  lat: number;
  lon: number;
  area: string;
  is_safe: boolean;
  safety_rating: number | null;
  lighting_ok?: boolean | null;
  crowd_level?: number | null;
  police_nearby?: boolean | null;
  cctv_seen?: boolean | null;
  harassment_reported?: boolean | null;
  transport_nearby?: boolean | null;
  comment?: string | null;
  time_of_day?: string | null;
  report_kind?: ReportKind | null;
  incident_type?: IncidentType | null;
  status?: string;
  is_synthetic?: boolean;
}

export interface AreaSafety {
  area: string;
  report_count: number;
  safe_count: number;
  unsafe_count: number;
  pct_safe: number;
  avg_rating: number | null;
  last_updated: string | null;
  synthetic_count?: number;
  live_count?: number;
}

export interface CommunitySummary {
  totalReports: number;
  safeReports: number;
  unsafeReports: number;
  pctSafe: number;
  avgRating: number | null;
  areasCovered: number;
  lastUpdated: string | null;
  syntheticReports?: number;
  liveReports?: number;
}

export interface ReportInput {
  lat: number;
  lon: number;
  area: string;
  is_safe: boolean;
  safety_rating?: number | null;
  lighting_ok?: boolean | null;
  crowd_level?: number | null;
  police_nearby?: boolean | null;
  cctv_seen?: boolean | null;
  harassment_reported?: boolean | null;
  transport_nearby?: boolean | null;
  comment?: string | null;
  time_of_day?: string | null;
  report_kind?: ReportKind;
  incident_type?: IncidentType | null;
}

export interface MapReport {
  id: string;
  lat: number;
  lon: number;
  area: string;
  is_safe: boolean;
  safety_rating: number | null;
  created_at: string;
  report_kind?: ReportKind | null;
  incident_type?: IncidentType | null;
  is_synthetic?: boolean;
}

const DEVICE_KEY = "safeher_device_id";
const RATE_LIMIT_PER_HOUR = 5;

function getSyntheticReports(): SafetyReport[] {
  return (syntheticJson as SafetyReport[]).map((r) => ({
    ...r,
    is_synthetic: true,
  }));
}

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function communityScore(pctSafe: number, avgRating: number | null): number {
  const fromPct = (pctSafe / 100) * 10;
  if (avgRating == null || Number.isNaN(avgRating)) {
    return Math.round(fromPct * 100) / 100;
  }
  const fromRating = (avgRating / 5) * 10;
  return Math.round((fromPct * 0.7 + fromRating * 0.3) * 100) / 100;
}

export function communityLevel(score: number): "Safe" | "Moderate" | "Unsafe" {
  if (score >= 7) return "Safe";
  if (score >= 4) return "Moderate";
  return "Unsafe";
}

export function aggregateReports(reports: SafetyReport[]): {
  summary: CommunitySummary;
  areas: AreaSafety[];
} {
  const byArea = new Map<
    string,
    {
      report_count: number;
      safe_count: number;
      unsafe_count: number;
      ratingSum: number;
      ratingN: number;
      last_updated: string | null;
      synthetic_count: number;
      live_count: number;
    }
  >();

  let safeReports = 0;
  let ratingSum = 0;
  let ratingN = 0;
  let lastUpdated: string | null = null;
  let syntheticReports = 0;
  let liveReports = 0;

  for (const r of reports) {
    if (r.is_synthetic) syntheticReports += 1;
    else liveReports += 1;
    if (r.is_safe) safeReports += 1;
    if (r.safety_rating != null) {
      ratingSum += r.safety_rating;
      ratingN += 1;
    }
    if (!lastUpdated || r.created_at > lastUpdated) lastUpdated = r.created_at;

    const cur = byArea.get(r.area) ?? {
      report_count: 0,
      safe_count: 0,
      unsafe_count: 0,
      ratingSum: 0,
      ratingN: 0,
      last_updated: null as string | null,
      synthetic_count: 0,
      live_count: 0,
    };
    cur.report_count += 1;
    if (r.is_safe) cur.safe_count += 1;
    else cur.unsafe_count += 1;
    if (r.safety_rating != null) {
      cur.ratingSum += r.safety_rating;
      cur.ratingN += 1;
    }
    if (!cur.last_updated || r.created_at > cur.last_updated) {
      cur.last_updated = r.created_at;
    }
    if (r.is_synthetic) cur.synthetic_count += 1;
    else cur.live_count += 1;
    byArea.set(r.area, cur);
  }

  const totalReports = reports.length;
  const areas: AreaSafety[] = [...byArea.entries()]
    .map(([area, v]) => ({
      area,
      report_count: v.report_count,
      safe_count: v.safe_count,
      unsafe_count: v.unsafe_count,
      pct_safe:
        v.report_count === 0
          ? 0
          : Math.round((1000 * v.safe_count) / v.report_count) / 10,
      avg_rating:
        v.ratingN === 0
          ? null
          : Math.round((v.ratingSum / v.ratingN) * 100) / 100,
      last_updated: v.last_updated,
      synthetic_count: v.synthetic_count,
      live_count: v.live_count,
    }))
    .sort((a, b) => b.report_count - a.report_count);

  return {
    summary: {
      totalReports,
      safeReports,
      unsafeReports: totalReports - safeReports,
      pctSafe:
        totalReports === 0
          ? 0
          : Math.round((1000 * safeReports) / totalReports) / 10,
      avgRating:
        ratingN === 0 ? null : Math.round((ratingSum / ratingN) * 100) / 100,
      areasCovered: areas.length,
      lastUpdated,
      syntheticReports,
      liveReports,
    },
    areas,
  };
}

async function loadLiveReports(limit = 2000): Promise<SafetyReport[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return ((data ?? []) as SafetyReport[]).map((r) => ({
      ...r,
      is_synthetic: false,
    }));
  } catch {
    return [];
  }
}

export async function loadAllReports(): Promise<SafetyReport[]> {
  const live = await loadLiveReports();
  const synthetic = getSyntheticReports();
  return [...live, ...synthetic].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
}

export async function ensureAnonymousSession(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session?.user?.id) return existing.session.user.id;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) return null;
  return data.user?.id ?? null;
}

export async function submitReport(
  input: ReportInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const deviceId = await getOrCreateDeviceId();
  const { data: recentCount, error: rateError } = await supabase.rpc(
    "count_recent_device_reports",
    { p_device_id: deviceId, p_minutes: 60 }
  );

  if (!rateError && typeof recentCount === "number" && recentCount >= RATE_LIMIT_PER_HOUR) {
    return {
      ok: false,
      error: `Rate limit: max ${RATE_LIMIT_PER_HOUR} reports per hour.`,
    };
  }

  const reporterId = await ensureAnonymousSession();

  const reportKind: ReportKind = input.report_kind ?? "feeling";
  const incidentType = reportKind === "incident" ? input.incident_type ?? null : null;
  const isSafe = reportKind === "incident" ? false : input.is_safe;
  const harassment =
    reportKind === "incident" &&
    (incidentType === "harassment" ||
      incidentType === "stalking" ||
      incidentType === "assault")
      ? true
      : (input.harassment_reported ?? null);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      lat: input.lat,
      lon: input.lon,
      area: input.area,
      is_safe: isSafe,
      safety_rating: input.safety_rating ?? null,
      lighting_ok: input.lighting_ok ?? null,
      crowd_level: input.crowd_level ?? null,
      police_nearby: input.police_nearby ?? null,
      cctv_seen: input.cctv_seen ?? null,
      harassment_reported: harassment,
      transport_nearby: input.transport_nearby ?? null,
      comment: input.comment?.trim() || null,
      time_of_day: input.time_of_day ?? getTimeOfDay(),
      report_kind: reportKind,
      incident_type: incidentType,
      reporter_id: reporterId,
      device_id: deviceId,
      status: "approved",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id as string };
}

export async function loadCommunitySummary(): Promise<CommunitySummary> {
  const reports = await loadAllReports();
  return aggregateReports(reports).summary;
}

export async function loadAreaSafety(): Promise<AreaSafety[]> {
  const reports = await loadAllReports();
  return aggregateReports(reports).areas;
}

export async function loadAreaVerdict(area: string): Promise<AreaSafety | null> {
  const areas = await loadAreaSafety();
  return areas.find((a) => a.area === area) ?? null;
}

export async function loadReportsForMap(limit = 500): Promise<MapReport[]> {
  const reports = await loadAllReports();
  return reports.slice(0, limit).map((r) => ({
    id: r.id,
    lat: r.lat,
    lon: r.lon,
    area: r.area,
    is_safe: r.is_safe,
    safety_rating: r.safety_rating,
    created_at: r.created_at,
    report_kind: r.report_kind ?? "feeling",
    incident_type: r.incident_type ?? null,
    is_synthetic: r.is_synthetic,
  }));
}
