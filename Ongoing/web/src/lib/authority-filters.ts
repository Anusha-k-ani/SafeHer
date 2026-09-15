import type { AnalysisHotspot, RiskLevel } from "./analysis";

export type AuthorityFilters = {
  area: string;
  risk: string;
  incidentType: string;
  timeOfDay: string;
  fromDate: string;
  toDate: string;
};

export const EMPTY_FILTERS: AuthorityFilters = {
  area: "all",
  risk: "all",
  incidentType: "all",
  timeOfDay: "all",
  fromDate: "",
  toDate: "",
};

export const RISK_OPTIONS: RiskLevel[] = ["High", "Medium", "Low"];
export const TIME_OPTIONS = ["morning", "afternoon", "evening", "night"];
export const TYPE_OPTIONS = [
  { value: "harassment", label: "Harassment" },
  { value: "unsafe_feeling", label: "Unsafe feeling" },
  { value: "stalking", label: "Stalking" },
  { value: "theft", label: "Theft" },
  { value: "assault", label: "Assault" },
  { value: "suspicious_activity", label: "Suspicious activity" },
  { value: "other", label: "Other" },
];

function inDateRange(iso: string | null, fromDate: string, toDate: string): boolean {
  if (!fromDate && !toDate) return true;
  if (!iso) return false;
  const day = iso.slice(0, 10);
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
}

export function hotspotMatches(h: AnalysisHotspot, f: AuthorityFilters): boolean {
  if (f.area !== "all" && h.area !== f.area) return false;
  if (f.risk !== "all" && h.risk_level !== f.risk) return false;
  if (f.timeOfDay !== "all") {
    const peakOk = h.peak_time_of_day === f.timeOfDay;
    const bucketOk = (h as AnalysisHotspot & { time_of_day?: Record<string, number> })
      .time_of_day?.[f.timeOfDay];
    if (!peakOk && !bucketOk) return false;
  }
  if (f.incidentType !== "all") {
    const n = h.incident_types?.[f.incidentType] ?? 0;
    if (n <= 0) return false;
  }
  if (!inDateRange(h.last_seen, f.fromDate, f.toDate)) return false;
  return true;
}
