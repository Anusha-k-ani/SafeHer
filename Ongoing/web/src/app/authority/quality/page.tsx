import { readFileSync, existsSync } from "fs";
import path from "path";
import { requireRoles } from "@/lib/suraksha/guard";

function loadJson(rel: string) {
  const file = path.join(process.cwd(), "..", "Module1_Analysis", "output", rel);
  const fallback = path.join(process.cwd(), "public", "data", "analysis", rel);
  const target = existsSync(file) ? file : fallback;
  if (!existsSync(target)) return null;
  return JSON.parse(readFileSync(target, "utf8"));
}

export default async function QualityPage() {
  await requireRoles(["supervisor", "reviewer", "admin"], "/authority/quality");
  const refresh = loadJson("refresh_status.json") as {
    state?: string;
    last_success_at?: string;
    generated_at?: string;
    error?: string | null;
  } | null;
  const coverage = loadJson("coverage.json") as {
    eligible_incidents?: number;
    verified_operational?: number;
    provisional_store?: number;
    missing_coordinates_in_raw?: number;
    missing_occurrence_times?: number;
    districts_with_classified_rows?: number;
    districts_in_state?: number;
    geographic_coverage_note?: string;
    last_successful_analysis?: string;
    district_match?: Record<string, number>;
    sources?: Record<string, string>;
    missing_occurred_at?: number;
    created_at_fallback_times?: number;
  } | null;
  const temporal = loadJson("temporal.json") as {
    timestamp_quality?: { occurred_at?: number; created_at_fallback?: number; missing?: number; note?: string };
  } | null;
  const summary = loadJson("summary.json") as {
    generated_at?: string;
    hotspot_count?: number;
    stats?: { synthetic?: number; live?: number; total_reports?: number };
    honesty?: Record<string, string>;
    inputs?: { crime_used_as_coordinates?: boolean };
  } | null;
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Data quality</h1>
      <p className="text-sm text-[#64748B]">
        Sources are labelled. A place with no reports is not treated as safe. District crime totals are not converted into street pins.
      </p>
      {!summary && <p className="text-sm text-[#B42318]">Analysis summary is not available. Run Module 1 or use Refresh analysis on Overview.</p>}
      {summary && (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Last successful analysis</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{refresh?.last_success_at || summary.generated_at || "unknown"}</dd>
            <p className="mt-1 text-xs text-[#64748B]">Refresh state: {refresh?.state || "unknown"}. A running refresh still shows the previous successful figures.</p>
            {refresh?.error && <p className="mt-1 text-xs text-[#B42318]">{refresh.error}</p>}
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Demo / operational rows in last run</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{summary.stats?.synthetic ?? 0} demo · {summary.stats?.live ?? 0} operational</dd>
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Hotspot cells</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{summary.hotspot_count ?? "—"}</dd>
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">KSP used as street coordinates</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{summary.inputs?.crime_used_as_coordinates ? "yes (error)" : "no"}</dd>
          </div>
        </dl>
      )}
      {coverage && (
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Eligible incidents in last run</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{coverage.eligible_incidents ?? "—"}</dd>
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Verified operational / provisional store</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{coverage.verified_operational ?? 0} / {coverage.provisional_store ?? 0}</dd>
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Missing coordinates</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{coverage.missing_coordinates_in_raw ?? 0}</dd>
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Occurrence time quality</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">
              occurred_at {temporal?.timestamp_quality?.occurred_at ?? 0} · created_at fallback {temporal?.timestamp_quality?.created_at_fallback ?? coverage.created_at_fallback_times ?? 0} · missing both {temporal?.timestamp_quality?.missing ?? coverage.missing_occurrence_times ?? 0}
            </dd>
            <p className="mt-1 text-xs text-[#64748B]">{temporal?.timestamp_quality?.note || "created_at is a labelled fallback when occurrence time is absent."}</p>
          </div>
          <div className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <dt className="text-sm text-[#64748B]">Districts with classified rows</dt>
            <dd className="mt-1 font-semibold text-[#17324D]">{coverage.districts_with_classified_rows ?? 0} of {coverage.districts_in_state ?? 30}</dd>
            <p className="mt-1 text-xs text-[#64748B]">{coverage.geographic_coverage_note}</p>
          </div>
        </dl>
      )}
      {coverage?.district_match && (
        <p className="text-sm text-[#64748B]">District match: {Object.entries(coverage.district_match).map(([k, v]) => `${k} ${v}`).join(" · ")}</p>
      )}
      {summary?.honesty && (
        <ul className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm text-[#64748B] space-y-2">
          {Object.entries(summary.honesty).map(([k, v]) => (
            <li key={k}><span className="font-semibold text-[#17324D]">{k}: </span>{v}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
