/** Workflow rules for SurakshaSetu. Pure functions so one script can check them. */

export type Role = "public" | "supervisor" | "reviewer" | "patrol" | "municipal" | "admin";

export const DEMO_USERS: { id: string; name: string; username: string; role: Role; password: string }[] = [
  { id: "u-citizen", name: "Demo citizen", username: "citizen", role: "public", password: "suraksha-demo" },
  { id: "u-supervisor", name: "Demo supervisor", username: "supervisor", role: "supervisor", password: "suraksha-demo" },
  { id: "u-reviewer", name: "Demo reviewer", username: "reviewer", role: "reviewer", password: "suraksha-demo" },
  { id: "u-patrol", name: "Demo patrol", username: "patrol", role: "patrol", password: "suraksha-demo" },
  { id: "u-municipal", name: "Demo municipal", username: "municipal", role: "municipal", password: "suraksha-demo" },
  { id: "u-admin", name: "Demo administrator", username: "admin", role: "admin", password: "suraksha-demo" },
];

export const INCIDENT_CATEGORIES = [
  "Verbal harassment / eve-teasing",
  "Stalking or being followed",
  "Unwanted touching / sexual harassment",
  "Threats or intimidation",
  "Physical assault",
  "Inappropriate gestures or behaviour",
  "Attempted abduction",
  "Other incident",
  "Not sure",
] as const;

export const LIGHT_FAULTS = [
  "Streetlight not working",
  "Streetlight flickering",
  "Multiple lights not functioning",
  "Poor illumination on a road segment",
  "Other infrastructure problem",
] as const;

export type SosStatus =
  | "created"
  | "location_unavailable"
  | "notification_attempted"
  | "notification_failed"
  | "acknowledged"
  | "unit_assigned"
  | "responding"
  | "resolved"
  | "escalated"
  | "cancelled";

export type TaskStatus =
  | "created"
  | "unit_selected"
  | "notified"
  | "acknowledged"
  | "responding"
  | "arrived"
  | "completed"
  | "declined"
  | "unavailable"
  | "reassigned"
  | "cancelled"
  | "escalated";

export type LightStatus =
  | "reported"
  | "under_review"
  | "forwarded"
  | "accepted"
  | "rejected"
  | "work_assigned"
  | "repair_in_progress"
  | "repair_completed"
  | "awaiting_verification"
  | "verified_closed";

const SOS_NEXT: Record<SosStatus, SosStatus[]> = {
  created: ["location_unavailable", "notification_attempted", "notification_failed", "cancelled"],
  location_unavailable: ["notification_attempted", "cancelled"],
  notification_attempted: ["acknowledged", "notification_failed", "escalated", "cancelled"],
  notification_failed: ["notification_attempted", "escalated", "cancelled"],
  acknowledged: ["unit_assigned", "escalated", "cancelled"],
  unit_assigned: ["responding", "escalated", "cancelled"],
  responding: ["resolved", "escalated"],
  resolved: [],
  escalated: ["acknowledged", "unit_assigned", "cancelled"],
  cancelled: [],
};

const TASK_NEXT: Record<TaskStatus, TaskStatus[]> = {
  created: ["unit_selected", "cancelled"],
  unit_selected: ["notified", "reassigned", "cancelled"],
  notified: ["acknowledged", "declined", "unavailable", "escalated", "reassigned", "cancelled"],
  acknowledged: ["responding", "unavailable", "reassigned", "cancelled"],
  responding: ["arrived", "unavailable", "escalated"],
  arrived: ["completed"],
  completed: [],
  declined: ["reassigned", "cancelled"],
  unavailable: ["reassigned", "cancelled"],
  reassigned: ["unit_selected"],
  cancelled: [],
  escalated: ["unit_selected", "cancelled"],
};

const LIGHT_NEXT: Record<LightStatus, LightStatus[]> = {
  reported: ["under_review"],
  under_review: ["forwarded", "rejected"],
  forwarded: ["accepted", "rejected"],
  accepted: ["work_assigned"],
  rejected: [],
  work_assigned: ["repair_in_progress"],
  repair_in_progress: ["repair_completed"],
  repair_completed: ["awaiting_verification"],
  awaiting_verification: ["verified_closed", "repair_in_progress"],
  verified_closed: [],
};

export function assertTransition<T extends string>(table: Record<T, T[]>, from: T, to: T): void {
  if (!table[from].includes(to)) {
    throw new Error(`Cannot move from ${from} to ${to}`);
  }
}

export function moveSos(from: SosStatus, to: SosStatus): SosStatus {
  assertTransition(SOS_NEXT, from, to);
  return to;
}

export function moveTask(from: TaskStatus, to: TaskStatus): TaskStatus {
  assertTransition(TASK_NEXT, from, to);
  return to;
}

export function moveLight(from: LightStatus, to: LightStatus): LightStatus {
  assertTransition(LIGHT_NEXT, from, to);
  return to;
}

export function nextLightStatuses(from: LightStatus): LightStatus[] {
  return LIGHT_NEXT[from];
}

const POLICE = new Set<Role>(["supervisor", "reviewer", "admin"]);
const PATROL_COMMAND = new Set<Role>(["supervisor", "admin"]);

export function canReviewIncidents(role: Role): boolean {
  return POLICE.has(role);
}

export function canCommandPatrol(role: Role): boolean {
  return PATROL_COMMAND.has(role);
}

export function canManageLights(role: Role): boolean {
  return role === "municipal" || role === "admin" || role === "supervisor" || role === "reviewer";
}

export function canVerifyRepair(role: Role): boolean {
  return role === "supervisor" || role === "reviewer" || role === "admin";
}

export function homeFor(role: Role): string {
  if (role === "public") return "/";
  if (role === "patrol") return "/patrol";
  if (role === "municipal") return "/municipal";
  return "/authority";
}

export type LocationFix = {
  latitude: number | null;
  longitude: number | null;
  district: string | null;
  street_id: string | null;
  street_name: string | null;
  match_status: "district_only" | "outside_karnataka" | "missing" | "not_verified";
  note: string;
};

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type DistrictPoint = { district: string; latitude: number; longitude: number };

/** District label from centroids already in the Karnataka OSM summary. Not a street match. */
export function matchDistrict(lat: number | null, lon: number | null, districts: DistrictPoint[]): LocationFix {
  if (lat == null || lon == null || Number.isNaN(lat) || Number.isNaN(lon)) {
    return {
      latitude: lat,
      longitude: lon,
      district: null,
      street_id: null,
      street_name: null,
      match_status: "missing",
      note: "Location unavailable. The report is stored without a road segment.",
    };
  }
  if (lat < 11.5 || lat > 18.6 || lon < 74 || lon > 78.6) {
    return {
      latitude: lat,
      longitude: lon,
      district: null,
      street_id: null,
      street_name: null,
      match_status: "outside_karnataka",
      note: "These coordinates are outside the Karnataka bounding box. No road segment was assigned.",
    };
  }
  let best: DistrictPoint | null = null;
  let bestKm = Infinity;
  for (const d of districts) {
    const km = haversineKm(lat, lon, d.latitude, d.longitude);
    if (km < bestKm) {
      best = d;
      bestKm = km;
    }
  }
  return {
    latitude: lat,
    longitude: lon,
    district: best?.district ?? null,
    street_id: null,
    street_name: null,
    match_status: "district_only",
    note: best
      ? `Nearest district centroid is ${best.district} (${bestKm.toFixed(0)} km). Street segment is not verified. A missing street match is not a claim that the road has no name.`
      : "District centroids are unavailable. Street segment is not verified.",
  };
}
