"use client";

import { useEffect, useState } from "react";

type Hotspot = { district?: string; area?: string; report_count?: number; risk_level?: string; evidence_category?: string };

export default function DistrictsPage() {
  const [rows, setRows] = useState<Hotspot[]>([]);
  const [coverage, setCoverage] = useState<{ districts_with_classified_rows?: number; districts_in_state?: number; geographic_coverage_note?: string } | null>(null);
  useEffect(() => {
    fetch("/api/suraksha/analysis/hotspots", { cache: "no-store" }).then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : []));
    fetch("/api/suraksha/analysis/coverage", { cache: "no-store" }).then((r) => r.json()).then(setCoverage);
  }, []);
  const byDistrict = new Map<string, { count: number; reports: number }>();
  for (const row of rows) {
    const name = row.district || row.area || "unlabelled";
    const cur = byDistrict.get(name) || { count: 0, reports: 0 };
    cur.count += 1;
    cur.reports += row.report_count || 0;
    byDistrict.set(name, cur);
  }
  const ranked = [...byDistrict.entries()].sort((a, b) => b[1].reports - a[1].reports);
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#0B1D33]">District Analysis</h1>
      <p className="text-sm text-[#64748B]">Counts come from published grid cells. This is not a street-level risk score. {coverage?.geographic_coverage_note}</p>
      <p className="text-sm">Districts with classified rows: {coverage?.districts_with_classified_rows ?? "—"} of {coverage?.districts_in_state ?? 30}</p>
      {ranked.map(([name, stats]) => (
        <article key={name} className="rounded-xl border bg-white p-4 text-sm">
          <strong>{name}</strong>
          <p className="mt-1 text-[#64748B]">{stats.count} hotspot cells · {stats.reports} reports in those cells</p>
        </article>
      ))}
    </main>
  );
}
