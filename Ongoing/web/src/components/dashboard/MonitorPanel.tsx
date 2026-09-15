"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthorityFilterBar } from "@/components/dashboard/AuthorityFilterBar";
import {
  loadAnalysisAlerts,
  loadAnalysisHotspots,
  RISK_COLOR,
  type AnalysisAlert,
  type AnalysisHotspot,
} from "@/lib/analysis";
import { EMPTY_FILTERS, hotspotMatches } from "@/lib/authority-filters";

export function DashboardMonitor() {
  const [hotspots, setHotspots] = useState<AnalysisHotspot[]>([]);
  const [alerts, setAlerts] = useState<AnalysisAlert[]>([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    Promise.all([loadAnalysisHotspots(), loadAnalysisAlerts()]).then(([h, a]) => {
      setHotspots(h);
      setAlerts(a);
    });
  }, []);

  const areas = useMemo(
    () => [...new Set(hotspots.map((h) => h.area))].sort(),
    [hotspots]
  );
  const filtered = useMemo(
    () => hotspots.filter((h) => hotspotMatches(h, filters)),
    [hotspots, filters]
  );
  const filteredAlerts = useMemo(
    () =>
      alerts.filter((a) => {
        const hs = hotspots.find((h) => h.hotspot_id === a.hotspot_id);
        return hs ? hotspotMatches(hs, filters) : hotspotMatches(
          {
            ...a,
            harassment_count: 0,
            peak_time_of_day: "",
            incident_types: {},
            source_note: "",
          } as AnalysisHotspot,
          filters
        );
      }),
    [alerts, hotspots, filters]
  );

  return (
    <div className="space-y-4">
      <AuthorityFilterBar value={filters} onChange={setFilters} areas={areas} />
      <div className="grid gap-4 sm:grid-cols-3">
        <MiniStat label="Matching hotspots" value={filtered.length} />
        <MiniStat
          label="High risk in view"
          value={filtered.filter((h) => h.risk_level === "High").length}
        />
        <MiniStat label="Matching alerts" value={filteredAlerts.length} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs uppercase text-[#6B7280]">
            <tr>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Peak time</th>
              <th className="px-4 py-3">Types</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 8).map((h) => (
              <tr key={h.hotspot_id} className="border-b border-[#F3F4F6]">
                <td className="px-4 py-3 font-medium">{h.area}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: RISK_COLOR[h.risk_level] }}
                  >
                    {h.risk_level}
                  </span>
                </td>
                <td className="px-4 py-3">{h.report_count}</td>
                <td className="px-4 py-3 capitalize">{h.peak_time_of_day}</td>
                <td className="px-4 py-3 text-[#6B7280]">
                  {Object.entries(h.incident_types)
                    .map(([k, n]) => `${k.replace("_", " ")} ${n}`)
                    .join(" · ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-[#6B7280]">
            No hotspots match these filters.
          </p>
        )}
      </div>
      <Link href="/admin/hotspots" className="inline-block text-sm font-semibold text-[#7C3AED]">
        Open full hotspot table and patrol alerts →
      </Link>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}
