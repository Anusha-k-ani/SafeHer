"use client";

import {
  EMPTY_FILTERS,
  RISK_OPTIONS,
  TIME_OPTIONS,
  TYPE_OPTIONS,
  type AuthorityFilters,
} from "@/lib/authority-filters";

const selectClass =
  "w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827]";

export function AuthorityFilterBar({
  value,
  onChange,
  areas,
}: {
  value: AuthorityFilters;
  onChange: (next: AuthorityFilters) => void;
  areas: string[];
}) {
  const set = (patch: Partial<AuthorityFilters>) => onChange({ ...value, ...patch });

  return (
    <section className="@container rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-col gap-2 @xl:flex-row @xl:items-start @xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">
            Authority filters
          </p>
          <p className="text-sm text-[#6B7280]">
            Area, incident type, date, time, and risk. Same controls on dashboard, hotspots, and map.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="self-start shrink-0 rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-6">
        <label className="block min-w-0 text-xs font-medium text-[#6B7280]">
          Area / region
          <select
            className={`${selectClass} mt-1`}
            value={value.area}
            onChange={(e) => set({ area: e.target.value })}
          >
            <option value="all">All areas</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-medium text-[#6B7280]">
          Incident type
          <select
            className={`${selectClass} mt-1`}
            value={value.incidentType}
            onChange={(e) => set({ incidentType: e.target.value })}
          >
            <option value="all">All types</option>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-medium text-[#6B7280]">
          Risk level
          <select
            className={`${selectClass} mt-1`}
            value={value.risk}
            onChange={(e) => set({ risk: e.target.value })}
          >
            <option value="all">All risk</option>
            {RISK_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-medium text-[#6B7280]">
          Time of day
          <select
            className={`${selectClass} mt-1`}
            value={value.timeOfDay}
            onChange={(e) => set({ timeOfDay: e.target.value })}
          >
            <option value="all">All times</option>
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block min-w-0 text-xs font-medium text-[#6B7280]">
          From date
          <input
            type="date"
            className={`${selectClass} mt-1`}
            value={value.fromDate}
            onChange={(e) => set({ fromDate: e.target.value })}
          />
        </label>
        <label className="block min-w-0 text-xs font-medium text-[#6B7280]">
          To date
          <input
            type="date"
            className={`${selectClass} mt-1`}
            value={value.toDate}
            onChange={(e) => set({ toDate: e.target.value })}
          />
        </label>
      </div>
    </section>
  );
}
