export type RiskLevel = "Low" | "Medium" | "High";

export interface AnalysisSummary {
  generated_at: string;
  hotspot_count: number;
  alert_count: number;
  risk_counts: Record<string, number>;
  stats: {
    total_reports: number;
    incident_like: number;
    unsafe_reports: number;
    harassment_flagged: number;
    synthetic: number;
    live: number;
    by_time_of_day: Record<string, number>;
    by_type: Record<string, number>;
  };
  honesty: {
    reports: string;
    hotspots: string;
    osm: string;
    crime_overlay: string | null;
  };
  preprocess: {
    before: number;
    after: number;
    dropped: Record<string, number>;
  };
}

export interface AnalysisHotspot {
  hotspot_id: string;
  latitude: number;
  longitude: number;
  report_count: number;
  harassment_count: number;
  risk_level: RiskLevel;
  area: string;
  peak_time_of_day: string;
  time_of_day?: Record<string, number>;
  incident_types: Record<string, number>;
  last_seen: string | null;
  source_note: string;
}

export interface AnalysisAlert {
  alert_id: string;
  hotspot_id: string;
  area: string;
  risk_level: RiskLevel;
  report_count: number;
  latitude: number;
  longitude: number;
  reason: string;
  last_seen: string | null;
  patrol_hint: string;
}

export async function loadAnalysisHotspots(): Promise<AnalysisHotspot[]> {
  const res = await fetch("/data/analysis/hotspots.json");
  if (!res.ok) return [];
  return res.json();
}

export async function loadAnalysisAlerts(): Promise<AnalysisAlert[]> {
  const res = await fetch("/data/analysis/alerts.json");
  if (!res.ok) return [];
  return res.json();
}

export const RISK_COLOR: Record<RiskLevel, string> = {
  High: "#E02424",
  Medium: "#D97706",
  Low: "#1A56DB",
};
