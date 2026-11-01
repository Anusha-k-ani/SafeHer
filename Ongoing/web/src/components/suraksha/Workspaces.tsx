"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { label, Pill, toneFor } from "./ui";
import { formatLocation, nextLightStatuses, sosPublicLabel, type LightStatus } from "@/lib/suraksha/domain";
import { AccountMenu } from "@/components/layout/AccountMenu";

type Role = "supervisor" | "reviewer" | "admin" | "patrol" | "municipal";

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function RoleNav({ role }: { role: Role }) {
  const links = [
    role !== "patrol" && role !== "municipal" ? ["/authority", "Overview", "layout"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/incidents", "Incident Management", "clipboard"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/alerts", "SOS Alerts", "radio"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/map", "Hotspot Intelligence", "radar"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/intelligence", "Temporal Analysis", "chart"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/districts", "District Analysis", "map"] : null,
    role === "supervisor" || role === "admin" ? ["/authority/patrol", "Patrol Management", "route"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/coverage", "Environmental Concerns", "leaf"] : null,
    role !== "patrol" ? ["/authority/lights", "Infrastructure", "light"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/exports", "Reports and Exports", "download"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/quality", "Data Quality", "database"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/audit", "Audit Logs", "history"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/settings", "Settings", "settings"] : null,
    role === "municipal" || role === "admin" ? ["/municipal", "Municipal work", "light"] : null,
    role === "patrol" || role === "supervisor" || role === "admin" ? ["/patrol", "My tasks", "route"] : null,
  ].filter(Boolean) as [string, string, string][];
  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-white/10 bg-[#0B1D33] px-4 py-3 text-sm text-white">
      {links.map(([href, text]) => (
        <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-white/10">{text}</Link>
      ))}
      <div className="ml-auto">
        <AccountMenu />
      </div>
    </nav>
  );
}

type RefreshInfo = {
  state?: "idle" | "requested" | "running" | "completed" | "failed";
  last_success_at?: string | null;
  generated_at?: string | null;
  error?: string | null;
};

export function Overview() {
  const [data, setData] = useState<Record<string, number | boolean> | null>(null);
  const [analysis, setAnalysis] = useState<{ stats?: { synthetic?: number; live?: number }; hotspot_count?: number; generated_at?: string; honesty?: { reports?: string } } | null>(null);
  const [refresh, setRefresh] = useState<RefreshInfo>({});
  const [error, setError] = useState("");
  const busy = refresh.state === "requested" || refresh.state === "running";
  async function loadAnalysis() {
    const [summaryRes, refreshRes] = await Promise.all([
      fetch("/api/suraksha/analysis/summary", { cache: "no-store" }),
      fetch("/api/suraksha/analysis/refresh", { cache: "no-store" }),
    ]);
    if (summaryRes.ok) setAnalysis(await summaryRes.json());
    if (refreshRes.ok) {
      const pack = await refreshRes.json();
      setRefresh(pack.refresh || {});
    }
  }
  useEffect(() => {
    api("/api/suraksha/inbox").then((d) => setData(d.overview)).catch((e) => setError(e.message));
    loadAnalysis().catch(() => setAnalysis(null));
  }, []);
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => loadAnalysis().catch(() => undefined), 2000);
    return () => window.clearInterval(id);
  }, [busy]);
  if (error) return <p className="p-4 text-sm text-[#B42318]">{error}</p>;
  if (!data) return <p className="p-4 text-sm text-[#64748B]">Loading operational counts…</p>;
  const cards = [
    ["Active SOS", data.active_sos, "/authority/alerts"],
    ["Unacknowledged SOS", data.unacknowledged_sos, "/authority/alerts"],
    ["Reports waiting", data.reports_waiting, "/authority/incidents"],
    ["Units available", data.units_available, "/authority/patrol"],
    ["Units assigned", data.units_assigned, "/authority/patrol"],
    ["Open streetlights", data.open_lights, "/authority/lights"],
    ["Waiting for municipality", data.lights_waiting_civic, "/municipal"],
  ] as const;
  const live = analysis?.stats?.live ?? 0;
  const demo = analysis?.stats?.synthetic ?? 0;
  const lastOk = refresh.last_success_at || analysis?.generated_at;
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Overview</h1>
      <p className="text-sm text-[#64748B]">Operational counts come from reports saved in this app. Hotspot cells come from Module 1. Dispatch and repair notices are simulated. This app does not replace 112 or professional police judgement.</p>
      <p className="rounded-xl border border-[#D8E0E8] bg-white px-3 py-2 text-sm text-[#64748B]">
        Analysis mix: <strong className="text-[#17324D]">{demo}</strong> labelled demo rows, <strong className="text-[#17324D]">{live}</strong> operational verified rows, <strong className="text-[#17324D]">{analysis?.hotspot_count ?? "—"}</strong> hotspot cells.
        <span className="ml-3">Refresh: <strong className="text-[#17324D]">{refresh.state || "idle"}</strong></span>
        {lastOk && <span className="ml-3">Last successful run: {lastOk}</span>}
        {busy && <span className="ml-3">Figures below are from the last successful run, not this in-progress refresh.</span>}
        {refresh.state === "failed" && refresh.error && <span className="ml-3 text-[#B42318]">{refresh.error}</span>}
        <button
          className="ml-3 text-[#0F766E] disabled:opacity-50"
          disabled={busy}
          onClick={() => api("/api/suraksha/analysis/refresh", "POST").then((d) => setRefresh(d.refresh || {})).then(() => loadAnalysis()).catch((e) => setError(e.message))}
        >
          {busy ? "Refresh running" : "Refresh analysis"}
        </button>
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([title, value, href]) => (
          <Link key={title} href={href} className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <p className="text-sm text-[#64748B]">{title}</p>
            <p className="mt-1 text-3xl font-bold text-[#17324D]">{String(value ?? 0)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AlertsBoard({ role }: { role: Role }) {
  const [alerts, setAlerts] = useState<{ id: string; status: string; user_message: string; created_at?: string; suggested_unit_id: string | null; location: { district: string | null; note: string; latitude?: number | null; longitude?: number | null; display_name?: string | null; street_name?: string | null; locality?: string | null } }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string; availability: string }[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  async function load() {
    const [sos, tasks] = await Promise.all([api("/api/suraksha/sos"), api("/api/suraksha/tasks")]);
    setAlerts(sos.alerts);
    setUnits(tasks.units);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  const visible = alerts.filter((alert) => !statusFilter || sosPublicLabel(alert.status as never) === statusFilter);
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">SOS Alerts</h1>
      <p className="text-sm text-[#64748B]">In-app alerts only. Assigning a unit records a demonstration task. This does not radio a patrol vehicle or contact 112.</p>
      <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All statuses</option>
        <option>New</option>
        <option>Acknowledged</option>
        <option>Resolved</option>
        <option>Cancelled</option>
      </select>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {visible.map((alert) => (
        <article key={alert.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{alert.id}</strong><Pill tone={toneFor(alert.status)}>{sosPublicLabel(alert.status as never)}</Pill></div>
          <p className="mt-2 text-sm">{alert.user_message}</p>
          <p className="mt-1 text-xs text-[#64748B]">{formatLocation(alert.location)}</p>
          {alert.location.latitude != null && alert.location.longitude != null && (
            <a className="mt-1 inline-block text-xs font-semibold text-[#0F766E]" href={`https://www.openstreetmap.org/?mlat=${alert.location.latitude}&mlon=${alert.location.longitude}#map=16/${alert.location.latitude}/${alert.location.longitude}`}>View on map</a>
          )}
          {alert.created_at && <p className="mt-1 text-xs text-[#64748B]">{new Date(alert.created_at).toLocaleString("en-IN")}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {(role === "supervisor" || role === "reviewer" || role === "admin") && (
              <>
                <button className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => api("/api/suraksha/sos", "PATCH", { id: alert.id, status: "acknowledged" }).then(load).catch((e) => setError(e.message))}>Acknowledge</button>
                <button className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => api("/api/suraksha/sos", "PATCH", { id: alert.id, status: "resolved" }).then(load).catch((e) => setError(e.message))}>Resolve</button>
              </>
            )}
            {(role === "supervisor" || role === "admin") && units.map((unit) => (
              <button key={unit.id} className="rounded-lg bg-[#17324D] px-3 py-2 text-xs font-semibold text-white" onClick={() => api("/api/suraksha/sos", "PATCH", { id: alert.id, action: "assign", unit_id: unit.id }).then(load).catch((e) => setError(e.message))}>
                Assign {unit.name} ({unit.availability})
              </button>
            ))}
          </div>
        </article>
      ))}
      {visible.length === 0 && <p className="text-sm text-[#64748B]">No alerts match this filter.</p>}
    </div>
  );
}

export function IncidentsBoard({ role }: { role: Role }) {
  const [reports, setReports] = useState<{ id: string; category: string; status: string; when: string; occurred_at: string; location: { district: string | null; note: string; street_name?: string | null; locality?: string | null; display_name?: string | null } }[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  async function load() { setReports((await api("/api/suraksha/reports")).reports); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  const canReview = role === "supervisor" || role === "reviewer" || role === "admin";
  const visible = reports.filter((report) => {
    const hay = `${report.id} ${report.category} ${formatLocation(report.location)}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (status && report.status !== status) return false;
    return true;
  });
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Incident Management</h1>
      <div className="flex flex-wrap gap-2">
        <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Search street, locality, district, id" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="submitted">submitted</option>
          <option value="under_review">under_review</option>
          <option value="verified">verified</option>
          <option value="flagged">flagged</option>
        </select>
      </div>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {visible.map((report) => (
        <article key={report.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{report.id}</strong><Pill tone={toneFor(report.status)}>{label(report.status)}</Pill></div>
          <p className="mt-2 text-sm">{report.category} | {report.when === "now" ? "Happening now" : "Past incident"} | {report.occurred_at ? new Date(report.occurred_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
          <p className="mt-1 text-xs text-[#64748B]">{formatLocation(report.location)}</p>
          {canReview && (
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => api("/api/suraksha/reports", "PATCH", { id: report.id, status: "under_review" }).then(load).catch((e) => setError(e.message))}>Mark under review</button>
              <button className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => api("/api/suraksha/reports", "PATCH", { id: report.id, status: "verified" }).then(load).catch((e) => setError(e.message))}>Verify</button>
              <button
                className="rounded-lg border px-3 py-2 text-xs font-semibold"
                onClick={() => {
                  const reason = window.prompt("Reason to flag this report");
                  if (!reason || reason.trim().length < 3) {
                    setError("A reason of at least 3 characters is required to flag a report.");
                    return;
                  }
                  api("/api/suraksha/reports", "PATCH", { id: report.id, status: "flagged", reason }).then(load).catch((e) => setError(e.message));
                }}
              >
                Flag
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

type Hotspot = {
  hotspot_id: string;
  district?: string;
  area?: string;
  risk_level: string;
  report_count: number;
  harassment_count: number;
  peak_time_of_day: string;
  time_of_day?: Record<string, number>;
  incident_types?: Record<string, number>;
  last_seen?: string;
  first_seen?: string;
  source_note?: string;
  evolution_class?: string;
  evolution_explanation?: string;
  evidence_category?: string;
  explanation?: string;
  incident_concern?: string;
  environmental_concern?: string | null;
  district_match?: string;
  nearest_street?: { street_id?: string; street_name?: string; safety_level?: string; lit?: string | null; factor_cctv?: number };
};

export function HotspotBoard() {
  const [rows, setRows] = useState<Hotspot[]>([]);
  const [district, setDistrict] = useState("");
  const [risk, setRisk] = useState("");
  const [evolution, setEvolution] = useState("");
  const [evidence, setEvidence] = useState("");
  const [tod, setTod] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Hotspot | null>(null);
  useEffect(() => {
    fetch("/api/suraksha/analysis/hotspots", { cache: "no-store" }).then((r) => r.json()).then((d) => setRows(Array.isArray(d) ? d : [])).catch(() => setRows([]));
  }, []);
  const districts = useMemo(() => [...new Set(rows.map((r) => r.district || r.area || ""))].filter(Boolean).sort(), [rows]);
  const filtered = rows.filter((r) => {
    if (district && (r.district || r.area) !== district) return false;
    if (risk && r.risk_level !== risk) return false;
    if (evolution && r.evolution_class !== evolution) return false;
    if (evidence && r.evidence_category !== evidence) return false;
    if (tod && !(r.time_of_day || {})[tod]) return false;
    if (from && (r.last_seen || "") < from) return false;
    if (to && (r.first_seen || "") > to) return false;
    return true;
  });
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold text-[#17324D]">Street-wise hotspot map</h1>
        <p className="mt-1 text-sm text-[#64748B]">About 1 km grid cells from Module 1. Verified operational reports are included after analysis refresh. Unverified reports are not clustered. A location with no reports is not labelled safe.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">All districts</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="">Incident concern</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={evolution} onChange={(e) => setEvolution(e.target.value)}>
            <option value="">All evolution</option>
            <option value="emerging">emerging</option>
            <option value="persistent">persistent</option>
            <option value="recurring">recurring</option>
            <option value="declining_observed">declining observed</option>
            <option value="observed">observed</option>
          </select>
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={evidence} onChange={(e) => setEvidence(e.target.value)}>
            <option value="">All evidence</option>
            <option value="synthetic">synthetic</option>
            <option value="operational">operational</option>
            <option value="mixed">mixed</option>
          </select>
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={tod} onChange={(e) => setTod(e.target.value)}>
            <option value="">Any time of day</option>
            <option value="morning">morning</option>
            <option value="afternoon">afternoon</option>
            <option value="evening">evening</option>
            <option value="night">night</option>
          </select>
          <input type="date" className="rounded-lg border bg-white px-2 py-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="rounded-lg border bg-white px-2 py-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
          <button type="button" className="rounded-lg border border-[#D8E0E8] bg-white px-3 py-2 text-sm" onClick={() => { setDistrict(""); setRisk(""); setEvolution(""); setEvidence(""); setTod(""); setFrom(""); setTo(""); setSelected(null); }}>Reset filters</button>
        </div>
        {filtered.length === 0 && <p className="mt-3 text-sm text-[#64748B]">No hotspot cells match these filters. That is not a claim those places are safe.</p>}
        <iframe title="Karnataka hotspot map" src="/data/analysis/maps/hotspots.html" className="mt-3 h-[480px] w-full rounded-xl border border-[#D8E0E8] bg-white" />
        <ul className="mt-3 max-h-64 space-y-2 overflow-auto">
          {filtered.map((row) => (
            <li key={row.hotspot_id}>
              <button className="w-full rounded-lg border border-[#D8E0E8] bg-white px-3 py-2 text-left text-sm" onClick={() => setSelected(row)}>
                {row.district || row.area}  |  {row.risk_level}  |  {row.report_count} reports
              </button>
            </li>
          ))}
        </ul>
      </div>
      <aside className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
        {!selected && <p className="text-[#64748B]">Select a cell. The count is reported activity in that grid, not a forecast and not a statement that other streets are safe.</p>}
        {selected && (
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#17324D]">{selected.hotspot_id}</h2>
            <Pill tone={selected.risk_level === "High" ? "red" : selected.risk_level === "Medium" ? "amber" : "blue"}>{selected.risk_level}</Pill>
            <p>{selected.explanation || `${selected.report_count} reports.`}</p>
            <p>Evolution: {selected.evolution_class || "—"} — {selected.evolution_explanation || "No window label."}</p>
            <p>Incident concern: {selected.incident_concern || selected.risk_level}. Environmental concern: {selected.environmental_concern || "not attached"}. Patrol priority is not computed.</p>
            <p>Evidence: {selected.evidence_category || "unlabelled"}. District match: {selected.district_match || "not stated"}.</p>
            <p>{selected.report_count} reports, {selected.harassment_count} tagged harassment. Peak time: {selected.peak_time_of_day}.</p>
            <p>Times: {Object.entries(selected.time_of_day || {}).map(([k, v]) => `${k} ${v}`).join(", ") || "Data unavailable"}</p>
            <p>Types: {Object.entries(selected.incident_types || {}).map(([k, v]) => `${k} ${v}`).join(", ") || "Data unavailable"}</p>
            <p>Nearest street: {selected.nearest_street?.street_name || "Not verified"} {selected.nearest_street?.street_id ? `(${selected.nearest_street.street_id})` : ""}</p>
            <p>Lighting tag: {selected.nearest_street?.lit || "Data unavailable"}</p>
            <p>CCTV factor: {selected.nearest_street?.factor_cctv ?? "Data unavailable"}. A missing camera record is not proof that no camera exists.</p>
            <p className="text-xs text-[#64748B]">{selected.source_note}</p>
          </div>
        )}
      </aside>
    </div>
  );
}

export function PatrolCommand({ role }: { role: Role }) {
  const [tasks, setTasks] = useState<{ id: string; type: string; status: string; instruction: string; history: { status: string; note: string }[] }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string; availability: string; location_note: string; district: string }[]>([]);
  const [type, setType] = useState("Patrol a specified road segment");
  const [error, setError] = useState("");
  async function load() {
    const data = await api("/api/suraksha/tasks");
    setTasks(data.tasks);
    setUnits(data.units);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Patrol command</h1>
      <p className="text-sm text-[#64748B]">The demo unit has no live GPS. Its location status stays unavailable.</p>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {units.map((unit) => (
        <article key={unit.id} className="rounded-xl border bg-white p-4 text-sm">
          <strong>{unit.name}</strong>  |  {unit.district}  |  {unit.availability}
          <p className="text-[#64748B]">{unit.location_note}</p>
          {(role === "supervisor" || role === "admin") && (
            <button className="mt-2 rounded-lg bg-[#0F766E] px-3 py-2 text-xs font-semibold text-white" onClick={() => api("/api/suraksha/tasks", "POST", { type, unit_id: unit.id, instruction: "Demonstration task. Do not treat this as a live order.", district: unit.district }).then(load).catch((e) => setError(e.message))}>
              Assign: {type}
            </button>
          )}
        </article>
      ))}
      {(role === "supervisor" || role === "admin") && (
        <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
          {["Respond to SOS", "Attend a current incident", "Patrol a specified road segment", "Conduct a hotspot patrol", "Inspect an identified unsafe location"].map((item) => <option key={item}>{item}</option>)}
        </select>
      )}
      {tasks.map((task) => (
        <article key={task.id} className="rounded-xl border bg-white p-4 text-sm">
          <div className="flex justify-between"><strong>{task.id}</strong><Pill tone={toneFor(task.status)}>{label(task.status)}</Pill></div>
          <p className="mt-1">{task.type}</p>
          <p className="text-[#64748B]">{task.instruction}</p>
          <p className="mt-1 text-xs">History: {task.history.map((h) => h.status).join(" ? ")}</p>
        </article>
      ))}
    </div>
  );
}

export function PatrolMobile() {
  const [tasks, setTasks] = useState<{ id: string; type: string; status: string; instruction: string; latitude: number | null; longitude: number | null }[]>([]);
  const [error, setError] = useState("");
  async function load() { setTasks((await api("/api/suraksha/tasks")).tasks); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  async function go(id: string, status: string) {
    try { await api("/api/suraksha/tasks", "PATCH", { id, status, note: "Updated from the patrol screen" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">My tasks</h1>
      <p className="text-sm text-[#64748B]">Update status only when the vehicle is stopped. These tasks are demonstration records.</p>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {tasks.map((task) => (
        <article key={task.id} className="rounded-2xl border bg-white p-4">
          <div className="flex justify-between"><strong>{task.type}</strong><Pill tone={toneFor(task.status)}>{label(task.status)}</Pill></div>
          <p className="mt-2 text-sm">{task.instruction}</p>
          {task.latitude != null && <a className="mt-2 inline-block text-sm font-semibold text-[#0F766E]" href={`https://www.openstreetmap.org/?mlat=${task.latitude}&mlon=${task.longitude}#map=16/${task.latitude}/${task.longitude}`}>Open directions</a>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="h-12 rounded-xl bg-[#1D4ED8] text-sm font-semibold text-white" onClick={() => go(task.id, "acknowledged")}>Acknowledge</button>
            <button className="h-12 rounded-xl bg-[#1D4ED8] text-sm font-semibold text-white" onClick={() => go(task.id, "responding")}>Responding</button>
            <button className="h-12 rounded-xl bg-[#1D4ED8] text-sm font-semibold text-white" onClick={() => go(task.id, "arrived")}>Arrived</button>
            <button className="h-12 rounded-xl bg-[#15803D] text-sm font-semibold text-white" onClick={() => go(task.id, "completed")}>Completed</button>
            <button className="h-12 rounded-xl border text-sm font-semibold" onClick={() => go(task.id, "unavailable")}>Unavailable</button>
          </div>
        </article>
      ))}
      {tasks.length === 0 && <p className="text-sm text-[#64748B]">No tasks assigned to this patrol account.</p>}
    </div>
  );
}

const LIGHT_ACTION: Record<string, string> = {
  under_review: "Mark under review",
  forwarded: "Forward to municipality",
  accepted: "Accept",
  rejected: "Reject",
  work_assigned: "Assign work",
  repair_in_progress: "Start repair",
  repair_completed: "Mark repair completed",
  awaiting_verification: "Send for verification",
  verified_closed: "Verify and close",
};

const CIVIC_STATUSES = new Set(["accepted", "rejected", "work_assigned", "repair_in_progress", "repair_completed"]);

export function LightsBoard({ role }: { role: Role }) {
  const [lights, setLights] = useState<{ id: string; fault: string; description: string; status: string; created_at: string; location: { district: string | null; note: string }; rejection_reason: string | null }[]>([]);
  const [error, setError] = useState("");
  async function load() { setLights((await api("/api/suraksha/lights")).lights); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  async function go(id: string, status: string) {
    try { await api("/api/suraksha/lights", "PATCH", { id, status, reason: status === "rejected" ? "Location was not verified." : undefined }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  }
  async function reportToPolice(id: string) {
    try { await api("/api/suraksha/lights", "PATCH", { id, action: "report_to_police" }); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
  }
  const authority = role === "supervisor" || role === "reviewer" || role === "admin";
  const civic = role === "municipal" || role === "admin";
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">{role === "municipal" ? "Municipal repairs" : "Streetlight complaints"}</h1>
      <p className="text-sm text-[#64748B]">{role === "municipal" ? "One tap marks the repair done and places it in the authority inbox. No live police unit is contacted." : "Each button is the next status this account can set. No work order is filed with a real municipality."}</p>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {lights.map((light) => {
        const next = nextLightStatuses(light.status as LightStatus).filter((status) => authority || (civic && CIVIC_STATUSES.has(status)));
        return (
          <article key={light.id} className="rounded-xl border bg-white p-4 text-sm">
            <div className="flex justify-between gap-3"><strong>{light.id}</strong><Pill tone={toneFor(light.status)}>{label(light.status)}</Pill></div>
            <p className="mt-2 font-semibold text-[#17324D]">{light.fault}</p>
            {light.description && <p className="mt-1">{light.description}</p>}
            <p className="mt-1 text-xs text-[#64748B]">{light.location.district || "District not matched"} | {light.location.note}</p>
            <p className="text-xs text-[#64748B]">{light.created_at ? new Date(light.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
            {light.rejection_reason && <p className="mt-1">Reason: {light.rejection_reason}</p>}
            {role === "municipal" && !["awaiting_verification", "verified_closed", "rejected"].includes(light.status) && (
              <button className="mt-3 h-12 w-full rounded-xl bg-[#17324D] text-sm font-semibold text-white" onClick={() => reportToPolice(light.id)}>
                Taken care of. Report to police
              </button>
            )}
            {role === "municipal" && light.status === "awaiting_verification" && (
              <p className="mt-3 text-sm text-[#1D4ED8]">Reported to the authority inbox. A live police unit was not contacted.</p>
            )}
            {role !== "municipal" && next.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {next.map((status) => (
                  <button key={status} className={`rounded-lg px-3 py-2 text-xs font-semibold ${status === "verified_closed" ? "bg-[#15803D] text-white" : "border"}`} onClick={() => go(light.id, status)}>
                    {LIGHT_ACTION[status] || label(status)}
                  </button>
                ))}
              </div>
            )}
          </article>
        );
      })}
      {lights.length === 0 && <p className="text-sm text-[#64748B]">No streetlight complaints yet.</p>}
    </div>
  );
}

export function IntelligenceBoard() {
  const [temporal, setTemporal] = useState<{
    timestamp_quality?: { occurred_at?: number; created_at_fallback?: number; missing?: number; note?: string };
    daily?: { date: string; count: number }[];
    weekly?: { week: string; count: number }[];
    monthly?: { month: string; count: number }[];
    hour_of_day?: { hour: number; count: number }[];
    day_of_week?: { day: string; count: number }[];
    date_range_comparison?: { first_half_count?: number; second_half_count?: number; interpretation?: string };
    seasonal?: { supported?: boolean; reason?: string; months_present?: string[] };
    evidence?: Record<string, number>;
  } | null>(null);
  const [methods, setMethods] = useState<{ default?: string; why_grid?: string; grid?: { hotspot_cells?: number }; dbscan?: { clusters?: number }; kde?: { cells_above_threshold?: number }; decision?: string } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      fetch("/api/suraksha/analysis/temporal", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/suraksha/analysis/method_compare", { cache: "no-store" }).then((r) => r.json()),
    ]).then(([t, m]) => {
      setTemporal(t.error ? null : t);
      setMethods(m.error ? null : m);
    }).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="p-4 text-sm text-[#B42318]">{error}</p>;
  if (!temporal) return <p className="p-4 text-sm text-[#64748B]">Loading temporal and method files…</p>;
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Geospatial and temporal intelligence</h1>
      <p className="text-sm text-[#64748B]">Published hotspots stay on the 1 km grid. DBSCAN and KDE are comparison only. Declining counts are not treated as safer streets.</p>
      <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
        <h2 className="font-semibold text-[#17324D]">Timestamp quality</h2>
        <p className="mt-1 text-[#64748B]">{temporal.timestamp_quality?.note}</p>
        <p className="mt-2">occurred_at {temporal.timestamp_quality?.occurred_at ?? 0} · created_at fallback {temporal.timestamp_quality?.created_at_fallback ?? 0} · missing {temporal.timestamp_quality?.missing ?? 0}</p>
        <p>Evidence in this series: demo {temporal.evidence?.synthetic ?? 0} · operational {temporal.evidence?.operational ?? 0}</p>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
          <h2 className="font-semibold text-[#17324D]">Daily</h2>
          {(temporal.daily || []).length === 0 ? (
            <p className="mt-2 text-[#64748B]">No dated incident-like rows in this extract.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-auto">{(temporal.daily || []).map((r) => <li key={r.date}>{r.date}: {r.count}</li>)}</ul>
          )}
        </section>
        <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
          <h2 className="font-semibold text-[#17324D]">Monthly</h2>
          <ul className="mt-2 space-y-1">{(temporal.monthly || []).map((r) => <li key={r.month}>{r.month}: {r.count}</li>)}</ul>
        </section>
        <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
          <h2 className="font-semibold text-[#17324D]">Weekly</h2>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto">{(temporal.weekly || []).map((r) => <li key={r.week}>{r.week}: {r.count}</li>)}</ul>
        </section>
        <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
          <h2 className="font-semibold text-[#17324D]">Day of week</h2>
          <ul className="mt-2 space-y-1">{(temporal.day_of_week || []).map((r) => <li key={r.day}>{r.day}: {r.count}</li>)}</ul>
        </section>
        <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
          <h2 className="font-semibold text-[#17324D]">Hour of day (UTC occurrence / fallback)</h2>
          <p className="mt-1 max-h-48 overflow-auto">{(temporal.hour_of_day || []).map((r) => `${r.hour}h ${r.count}`).join(" · ")}</p>
        </section>
      </div>
      <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
        <h2 className="font-semibold text-[#17324D]">Date-range comparison</h2>
        <p className="mt-1">{temporal.date_range_comparison?.first_half_count} then {temporal.date_range_comparison?.second_half_count}. {temporal.date_range_comparison?.interpretation}</p>
        <p className="mt-2 text-[#64748B]">Seasonal: {temporal.seasonal?.supported ? "supported" : "not supported"}. {temporal.seasonal?.reason}</p>
      </section>
      {methods && (
        <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm">
          <h2 className="font-semibold text-[#17324D]">Method comparison (experimental)</h2>
          <p className="mt-1 text-[#64748B]">DBSCAN and KDE are comparison-only. They are not published risk and are not drawn on the hotspot map.</p>
          <p className="mt-1">{methods.why_grid}</p>
          <p className="mt-2">Published grid cells: {methods.grid?.hotspot_cells}. DBSCAN clusters (not published): {methods.dbscan?.clusters}. KDE cells (not published): {methods.kde?.cells_above_threshold}.</p>
          <p className="mt-1 font-semibold text-[#17324D]">{methods.decision}</p>
        </section>
      )}
    </div>
  );
}
