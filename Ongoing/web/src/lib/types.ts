export type SafetyLevel = "Safe" | "Moderate" | "Unsafe";

export interface Street {
  Street_ID: string;
  Street_Name: string;
  Area: string;
  Latitude: number;
  Longitude: number;
  Bus_Stop_Count: number;
  Police_Distance_m: number;
  Hospital_Distance_m: number;
  CCTV: number;
  Lighting: number;
  Crowd_Level: number;
  Commercial_Area: number;
  Night_Activity: number;
  Road_Condition: number;
  Safety_Score: number;
  Safety_Level: SafetyLevel;
}

export interface StreetMapPoint {
  id: string;
  lat: number;
  lon: number;
  score: number;
  level: SafetyLevel;
  area: string;
  name: string;
}

export interface AreaSummary {
  Area: string;
  Street_Count: number;
  Avg_Safety_Score: number;
  Safe: number;
  Moderate: number;
  Unsafe: number;
}

export interface AreaDistribution {
  Area: string;
  Moderate: number;
  Safe: number;
  Unsafe: number;
}

export interface SummaryData {
  totalStreets: number;
  areasCovered: number;
  safe: number;
  moderate: number;
  unsafe: number;
  avgSafetyScore: number;
  generatedOn: string;
  cctvCoveragePct: number;
  avgPoliceDistance: number;
  avgHospitalDistance: number;
  scoreDistribution: { range: string; count: number }[];
  factorAverages: {
    lighting: number;
    crowd: number;
    commercial: number;
    night: number;
    road: number;
  };
}

export interface FactorBreakdown {
  name: string;
  weight: number;
  subScore: number;
  weighted: number;
}

export interface SafetyBreakdown {
  total: number;
  level: SafetyLevel;
  factors: FactorBreakdown[];
}
