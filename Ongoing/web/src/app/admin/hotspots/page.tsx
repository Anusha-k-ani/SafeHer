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

export default function AdminHotspotsPage() {
  const [hotspots, setHotspots] = useState<AnalysisHotspot[]>([]);
  const [alerts, setAlerts] = useState<AnalysisAlert[]>([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadAnalysisHotspots(), loadAnalysisAlerts()])
      .then(([h, a]) => {
        setHotspots(h);
        setAlerts(a);
      })
      .finally(() => setLoading(false));
  }, []);

  const areas = useMemo(
    () => [...new Set(hotspots.map((h) => h.area))].sort(),
    [hotspots]
  );

  const filtered = useMemo(
    () => hotspots.filter((h) => hotspotMatches(h, filters)),
    [hotspots, filters]
  );
  const filteredAlerts = useMemo(() => {
    const ids = new Set(filtered.map((h) => h.hotspot_id));
    return alerts.filter((a) => ids.has(a.hotspot_id));
  }, [alerts, filtered]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-[#6B7280]">
        Loading analysis…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
          Module 1 · analysis
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#111827]">
          Hotspots and patrol alerts
        </h1>
        <p className="mt-2 max-w-3xl text-[#6B7280]">
          Clusters of unsafe / incident-like app reports on a ~1 km grid. OSM
          street scores stay a separate layer. Not live crime prediction.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Matching hotspots" value={String(filtered.length)} />
        <Stat
          label="High risk in view"
          value={String(filtered.filter((h) => h.risk_level === "High").length)}
        />
        <Stat label="Matching alerts" value={String(filteredAlerts.length)} />
      </div>

      <AuthorityFilterBar value={filters} onChange={setFilters} areas={areas} />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#111827]">Daily patrol alerts</h2>
          <Link
            href="/admin/map"
            className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white"
          >
            View on map
          </Link>
        </div>
        <div className="space-y-2">
          {filteredAlerts.slice(0, 12).map((a) => (
            <div
              key={a.alert_id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#111827]">{a.area}</p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: RISK_COLOR[a.risk_level] }}
                >
                  {a.risk_level}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">{a.reason}</p>
              <p className="mt-1 text-sm text-[#374151]">{a.patrol_hint}</p>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {a.report_count} reports
                {a.last_seen ? ` · last ${new Date(a.last_seen).toLocaleString()}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs uppercase text-[#6B7280]">
            <tr>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">Reports</th>
              <th className="px-4 py-3">Harassment</th>
              <th className="px-4 py-3">Peak time</th>
              <th className="px-4 py-3">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h) => (
              <tr key={h.hotspot_id} className="border-b border-[#F3F4F6]">
                <td className="px-4 py-3 font-medium text-[#111827]">{h.area}</td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: RISK_COLOR[h.risk_level] }}
                  >
                    {h.risk_level}
                  </span>
                </td>
                <td className="px-4 py-3">{h.report_count}</td>
                <td className="px-4 py-3">{h.harassment_count}</td>
                <td className="px-4 py-3 capitalize">{h.peak_time_of_day}</td>
                <td className="px-4 py-3 text-[#6B7280]">
                  {h.latitude.toFixed(4)}, {h.longitude.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-[#6B7280]">
            No hotspots for these filters. Run{" "}
            <code>python3 Module1_Analysis/pipeline.py</code> if analysis files are missing.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-[#111827]">{value}</p>
    </div>
  );
}
