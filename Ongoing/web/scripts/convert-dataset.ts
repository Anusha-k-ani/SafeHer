import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const ROOT = path.resolve(__dirname, "../..");
const PROJECT_ROOT = path.resolve(__dirname, "..");
const XLSX_CANDIDATES = [
  path.join(ROOT, "bengaluru_street_safety_REAL.xlsx"),
  path.join(PROJECT_ROOT, "bengaluru_street_safety_REAL.xlsx"),
  path.join(PROJECT_ROOT, "data", "bengaluru_street_safety_REAL.xlsx"),
];
const OUT_DIR = path.join(PROJECT_ROOT, "public", "data");

const REQUIRED_OUTPUTS = [
  "streets.json",
  "streets.min.json",
  "areas.json",
  "summary.json",
] as const;

function findExcelPath(): string | null {
  for (const candidate of XLSX_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function hasCommittedData(): boolean {
  return REQUIRED_OUTPUTS.every((file) =>
    fs.existsSync(path.join(OUT_DIR, file))
  );
}

interface RawStreet {
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
  Safety_Level: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function scoreBin(score: number): string {
  if (score <= 4) return "0–4";
  if (score <= 5) return "4–5";
  if (score <= 6) return "5–6";
  if (score <= 7) return "6–7";
  if (score <= 8) return "7–8";
  return "8–10";
}

function main() {
  const xlsxPath = findExcelPath();

  if (!xlsxPath) {
    if (hasCommittedData()) {
      console.log(
        "Excel not found — using existing JSON in public/data (Vercel / CI mode)"
      );
      return;
    }
    console.error(
      "Excel file not found. Expected one of:\n" +
        XLSX_CANDIDATES.map((p) => `  - ${p}`).join("\n") +
        "\nOr commit pre-generated files under public/data/"
    );
    process.exit(1);
  }

  ensureDir(OUT_DIR);

  const wb = XLSX.readFile(xlsxPath);
  const streetsSheet = XLSX.utils.sheet_to_json<RawStreet>(
    wb.Sheets["Street Safety Dataset"]
  );
  const areaSheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    wb.Sheets["Area Summary"]
  );
  const summarySheet = XLSX.utils.sheet_to_json<{
    Metric: string;
    Value: string | number;
  }>(wb.Sheets["Summary"]);

  const streets = streetsSheet.map((row) => ({
    ...row,
    Latitude: Math.round(Number(row.Latitude) * 1e6) / 1e6,
    Longitude: Math.round(Number(row.Longitude) * 1e6) / 1e6,
    Safety_Score: Math.round(Number(row.Safety_Score) * 100) / 100,
  }));

  const mapPoints = streets.map((s) => ({
    id: s.Street_ID,
    lat: s.Latitude,
    lon: s.Longitude,
    score: s.Safety_Score,
    level: s.Safety_Level,
    area: s.Area,
    name: s.Street_Name,
  }));

  const summaryMap = Object.fromEntries(
    summarySheet.map((r) => [r.Metric, r.Value])
  );

  const binCounts: Record<string, number> = {
    "0–4": 0,
    "4–5": 0,
    "5–6": 0,
    "6–7": 0,
    "7–8": 0,
    "8–10": 0,
  };
  for (const s of streets) {
    binCounts[scoreBin(s.Safety_Score)]++;
  }

  const cctvCount = streets.filter((s) => s.CCTV === 1).length;
  const avg = (key: keyof RawStreet) =>
    streets.reduce((sum, s) => sum + Number(s[key]), 0) / streets.length;

  const summary = {
    totalStreets: Number(summaryMap["Total Streets"] ?? streets.length),
    areasCovered: Number(summaryMap["Areas Covered"] ?? areaSheet.length),
    safe: Number(summaryMap["Safe"] ?? 0),
    moderate: Number(summaryMap["Moderate"] ?? 0),
    unsafe: Number(summaryMap["Unsafe"] ?? 0),
    avgSafetyScore: Number(summaryMap["Avg Safety Score"] ?? avg("Safety_Score")),
    generatedOn: String(summaryMap["Generated On"] ?? new Date().toISOString()),
    cctvCoveragePct: Math.round((cctvCount / streets.length) * 1000) / 10,
    avgPoliceDistance: Math.round(avg("Police_Distance_m")),
    avgHospitalDistance: Math.round(avg("Hospital_Distance_m")),
    scoreDistribution: Object.entries(binCounts).map(([range, count]) => ({
      range,
      count,
    })),
    factorAverages: {
      lighting: Math.round(avg("Lighting") * 100) / 100,
      crowd: Math.round(avg("Crowd_Level") * 100) / 100,
      commercial: Math.round(avg("Commercial_Area") * 100) / 100,
      night: Math.round(avg("Night_Activity") * 100) / 100,
      road: Math.round(avg("Road_Condition") * 100) / 100,
    },
  };

  fs.writeFileSync(
    path.join(OUT_DIR, "streets.json"),
    JSON.stringify(streets)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "streets.min.json"),
    JSON.stringify(mapPoints)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "areas.json"),
    JSON.stringify(areaSheet)
  );
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`Converted ${streets.length} streets`);
  console.log(`Output: ${OUT_DIR}`);
}

main();
