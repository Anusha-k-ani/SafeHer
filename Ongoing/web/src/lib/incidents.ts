export type ReportKind = "feeling" | "incident";

export type IncidentType =
  | "harassment"
  | "stalking"
  | "theft"
  | "assault"
  | "suspicious_activity"
  | "other";

export type FeelingChoice = "safe" | "unsafe" | "incident";

export const INCIDENT_OPTIONS: { value: IncidentType; label: string; hint: string }[] = [
  {
    value: "harassment",
    label: "Harassment",
    hint: "Catcalling, unwanted comments, or touching",
  },
  {
    value: "stalking",
    label: "Stalking / following",
    hint: "Someone followed or watched you",
  },
  {
    value: "theft",
    label: "Theft / snatching",
    hint: "Bag, phone, or belongings taken",
  },
  {
    value: "assault",
    label: "Assault / violence",
    hint: "Physical attack or threat of violence",
  },
  {
    value: "suspicious_activity",
    label: "Suspicious activity",
    hint: "Felt threatened by behavior nearby",
  },
  {
    value: "other",
    label: "Other incident",
    hint: "Something else that put you at risk",
  },
];

export function incidentLabel(type: IncidentType | string | null | undefined): string {
  if (!type) return "Incident";
  return INCIDENT_OPTIONS.find((o) => o.value === type)?.label ?? type;
}
