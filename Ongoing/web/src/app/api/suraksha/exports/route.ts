import { fail } from "@/lib/suraksha/http";
import { requireUser } from "@/lib/suraksha/http";
import { canReviewIncidents } from "@/lib/suraksha/domain";
import { formatLocation } from "@/lib/suraksha/domain";
import { listReports } from "@/lib/suraksha/store";
import { existsSync, readFileSync } from "fs";
import path from "path";

function csv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

function analysisJson(name: string): unknown {
  const file = path.join(process.cwd(), "..", "Module1_Analysis", "output", `${name}.json`);
  const fallback = path.join(process.cwd(), "public", "data", "analysis", `${name}.json`);
  const target = existsSync(file) ? file : fallback;
  if (!existsSync(target)) return null;
  return JSON.parse(readFileSync(target, "utf8"));
}

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    if (!canReviewIncidents(user.role)) throw new Error("Not allowed to export operational reports.");
    const kind = new URL(request.url).searchParams.get("kind") || "incidents";
    if (kind === "incidents") {
      const rows = listReports(user.role, user.id);
      const body = csv([
        ["id", "category", "status", "occurred_at", "location", "district"],
        ...rows.map((row) => [row.id, row.category, row.status, row.occurred_at, formatLocation(row.location), row.location.district || ""]),
      ]);
      return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
    }
    if (kind === "hotspots") {
      const pack = analysisJson("hotspots") as { hotspot_id?: string; district?: string; report_count?: number; risk_level?: string; evidence_category?: string }[] | null;
      const rows = Array.isArray(pack) ? pack : [];
      const body = csv([
        ["hotspot_id", "district", "report_count", "incident_concern", "evidence"],
        ...rows.map((row) => [row.hotspot_id || "", row.district || "", String(row.report_count ?? ""), row.risk_level || "", row.evidence_category || ""]),
      ]);
      return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
    }
    if (kind === "coverage") {
      const pack = (analysisJson("coverage") || {}) as Record<string, unknown>;
      const body = csv([
        ["field", "value"],
        ...Object.entries(pack).filter(([, value]) => typeof value !== "object").map(([key, value]) => [key, String(value)]),
      ]);
      return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8" } });
    }
    throw new Error("Unknown export.");
  } catch (error) {
    return fail(error, 403);
  }
}
