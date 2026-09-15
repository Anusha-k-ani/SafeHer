import type { FactorBreakdown, SafetyBreakdown, SafetyLevel, Street } from "./types";

export function scoreBusStops(count: number): number {
  if (count >= 3) return 10;
  if (count === 2) return 7;
  if (count === 1) return 5;
  return 2;
}

export function scorePoliceDistance(dist: number): number {
  if (dist <= 300) return 10;
  if (dist <= 600) return 8;
  if (dist <= 1000) return 6;
  if (dist <= 2000) return 4;
  return 2;
}

export function scoreHospitalDistance(dist: number): number {
  if (dist <= 500) return 10;
  if (dist <= 1000) return 8;
  if (dist <= 2000) return 6;
  if (dist <= 3000) return 4;
  return 2;
}

export function scoreCctv(hasCctv: boolean): number {
  return hasCctv ? 10 : 3;
}

export function getSafetyLevel(score: number): SafetyLevel {
  if (score >= 7) return "Safe";
  if (score >= 4) return "Moderate";
  return "Unsafe";
}

export function computeSafetyBreakdown(street: Street): SafetyBreakdown {
  const factors: FactorBreakdown[] = [
    {
      name: "Police Distance",
      weight: 0.2,
      subScore: scorePoliceDistance(street.Police_Distance_m),
      weighted: 0,
    },
    {
      name: "Hospital Distance",
      weight: 0.15,
      subScore: scoreHospitalDistance(street.Hospital_Distance_m),
      weighted: 0,
    },
    {
      name: "Lighting",
      weight: 0.15,
      subScore: street.Lighting,
      weighted: 0,
    },
    {
      name: "Bus Stop Count",
      weight: 0.15,
      subScore: scoreBusStops(street.Bus_Stop_Count),
      weighted: 0,
    },
    {
      name: "Crowd Level",
      weight: 0.1,
      subScore: street.Crowd_Level,
      weighted: 0,
    },
    {
      name: "CCTV",
      weight: 0.1,
      subScore: scoreCctv(street.CCTV === 1),
      weighted: 0,
    },
    {
      name: "Road Condition",
      weight: 0.05,
      subScore: street.Road_Condition,
      weighted: 0,
    },
    {
      name: "Night Activity",
      weight: 0.05,
      subScore: street.Night_Activity,
      weighted: 0,
    },
    {
      name: "Commercial Area",
      weight: 0.05,
      subScore: street.Commercial_Area,
      weighted: 0,
    },
  ];

  for (const factor of factors) {
    factor.weighted = Math.round(factor.subScore * factor.weight * 100) / 100;
  }

  const total =
    Math.round(factors.reduce((sum, f) => sum + f.weighted, 0) * 100) / 100;

  return {
    total,
    level: getSafetyLevel(total),
    factors,
  };
}

export const SCORING_WEIGHTS = [
  {
    factor: "Police Distance",
    weight: "20%",
    how: "10 if ≤300m | 8 if ≤600m | 6 if ≤1km | 4 if ≤2km | 2 otherwise",
  },
  {
    factor: "Hospital Distance",
    weight: "15%",
    how: "10 if ≤500m | 8 if ≤1km | 6 if ≤2km | 4 if ≤3km | 2 otherwise",
  },
  {
    factor: "Lighting",
    weight: "15%",
    how: "Derived from OSM lit tag + nearby street lamp count",
  },
  {
    factor: "Bus Stop Count",
    weight: "15%",
    how: "10 if 3+ within 500m | 7 if 2 | 5 if 1 | 2 if none",
  },
  {
    factor: "Crowd Level",
    weight: "10%",
    how: "Inferred from highway type (primary=8, pedestrian=9, residential=5)",
  },
  {
    factor: "CCTV",
    weight: "10%",
    how: "10 if any camera within 300m | 3 if none",
  },
  {
    factor: "Road Condition",
    weight: "5%",
    how: "10 for asphalt/concrete | 3 for unpaved | inferred if unknown",
  },
  {
    factor: "Night Activity",
    weight: "5%",
    how: "Derived from highway type + crowd score",
  },
  {
    factor: "Commercial Area",
    weight: "5%",
    how: "Inferred from highway type (major roads = higher commercial activity)",
  },
] as const;
