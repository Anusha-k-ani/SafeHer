import type { SafetyLevel } from "./types";

export const BRAND = {
  primary: "#1A56DB",
  primaryLight: "#EBF2FF",
  safe: "#0E9F6E",
  safeLight: "#F0FDF4",
  moderate: "#D97706",
  moderateLight: "#FFFBEB",
  unsafe: "#E02424",
  unsafeLight: "#FDF2F2",
  dark: "#111827",
  mid: "#374151",
  muted: "#6B7280",
  rule: "#D1D5DB",
} as const;

export function safetyLevelColor(level: SafetyLevel): string {
  switch (level) {
    case "Safe":
      return BRAND.safe;
    case "Moderate":
      return BRAND.moderate;
    case "Unsafe":
      return BRAND.unsafe;
  }
}

export function safetyLevelBg(level: SafetyLevel): string {
  switch (level) {
    case "Safe":
      return BRAND.safeLight;
    case "Moderate":
      return BRAND.moderateLight;
    case "Unsafe":
      return BRAND.unsafeLight;
  }
}
