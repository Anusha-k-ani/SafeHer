"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { label, Pill, toneFor } from "./ui";
import { nextLightStatuses, type LightStatus } from "@/lib/suraksha/domain";

type Role = "supervisor" | "reviewer" | "admin" | "patrol" | "municipal";

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function RoleNav({ role }: { role: Role }) {
  const links = [
    role !== "patrol" && role !== "municipal" ? ["/authority", "Overview"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/alerts", "Alerts"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/incidents", "Incidents"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/map", "Hotspot map"] : null,
    role !== "patrol" && role !== "municipal" ? ["/authority/coverage", "Data coverage"] : null,
    role === "supervisor" || role === "admin" ? ["/authority/patrol", "Patrol command"] : null,
    role !== "patrol" ? ["/authority/lights", "Streetlights"] : null,
    role === "municipal" || role === "admin" ? ["/municipal", "Municipal work"] : null,
    role === "patrol" || role === "supervisor" || role === "admin" ? ["/patrol", "My tasks"] : null,
  ].filter(Boolean) as [string, string][];
  return (
    <nav className="flex flex-wrap gap-2 border-b border-[#D8E0E8] bg-[#17324D] px-4 py-3 text-sm text-white">
      {links.map(([href, text]) => (
        <Link key={href} href={href} className="rounded-lg px-3 py-2 hover:bg-white/10">{text}</Link>
      ))}
      <button
        className="ml-auto rounded-lg px-3 py-2 text-white/80"
        onClick={async () => {
          await fetch("/api/suraksha/session", { method: "DELETE" });
          location.href = "/login";
        }}
      >
        Sign out
      </button>
    </nav>
  );
}

export function Overview() {
  const [data, setData] = useState<Record<string, number | boolean> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api("/api/suraksha/inbox").then((d) => setData(d.overview)).catch((e) => setError(e.message));
  }, []);
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
  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Overview</h1>
      <p className="text-sm text-[#64748B]">Counts come from reports saved in this app. Hotspot cells on the map come from the existing Karnataka analysis file. Dispatch and repair notices are simulated.</p>
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
  const [alerts, setAlerts] = useState<{ id: string; status: string; user_message: string; suggested_unit_id: string | null; location: { district: string | null; note: string } }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string; availability: string }[]>([]);
  const [error, setError] = useState("");
  async function load() {
    const [sos, tasks] = await Promise.all([api("/api/suraksha/sos"), api("/api/suraksha/tasks")]);
    setAlerts(sos.alerts);
    setUnits(tasks.units);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Emergency alerts</h1>
      <p className="text-sm text-[#64748B]">Simulated dispatch. Assigning a unit records an in-app task. It does not radio a patrol vehicle.</p>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {alerts.map((alert) => (
        <article key={alert.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{alert.id}</strong><Pill tone={toneFor(alert.status)}>{label(alert.status)}</Pill></div>
          <p className="mt-2 text-sm">{alert.user_message}</p>
          <p className="mt-1 text-xs text-[#64748B]">{alert.location.district || "No district"}  |  {alert.location.note}</p>
          {(role === "supervisor" || role === "admin") && (
            <div className="mt-3 flex flex-wrap gap-2">
              {units.map((unit) => (
                <button key={unit.id} className="rounded-lg bg-[#17324D] px-3 py-2 text-xs font-semibold text-white" onClick={() => api("/api/suraksha/sos", "PATCH", { id: alert.id, action: "assign", unit_id: unit.id }).then(load).catch((e) => setError(e.message))}>
                  Assign {unit.name} ({unit.availability})
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
      {alerts.length === 0 && <p className="text-sm text-[#64748B]">No alerts for this account.</p>}
    </div>
  );
}

export function IncidentsBoard({ role }: { role: Role }) {
  const [reports, setReports] = useState<{ id: string; category: string; status: string; when: string; occurred_at: string; location: { district: string | null; note: string } }[]>([]);
  const [error, setError] = useState("");
  async function load() { setReports((await api("/api/suraksha/reports")).reports); }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  const canReview = role === "supervisor" || role === "reviewer" || role === "admin";
  return (
    <div className="space-y-3 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Incident reports</h1>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {reports.map((report) => (
        <article key={report.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{report.id}</strong><Pill tone={toneFor(report.status)}>{label(report.status)}</Pill></div>
          <p className="mt-2 text-sm">{report.category} | {report.when === "now" ? "Happening now" : "Past incident"} | {report.occurred_at ? new Date(report.occurred_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
          <p className="mt-1 text-xs text-[#64748B]">{report.location.note}</p>
          {canReview && (
            <div className="mt-3 flex gap-2">
              <button className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => api("/api/suraksha/reports", "PATCH", { id: report.id, status: "under_review" }).then(load).catch((e) => setError(e.message))}>Mark under review</button>
              <button className="rounded-lg border px-3 py-2 text-xs font-semibold" onClick={() => api("/api/suraksha/reports", "PATCH", { id: report.id, status: "verified" }).then(load).catch((e) => setError(e.message))}>Verify</button>
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
  source_note?: string;
  nearest_street?: { street_id?: string; street_name?: string; safety_level?: string; lit?: string | null; factor_cctv?: number };
};

export function HotspotBoard() {
  const [rows, setRows] = useState<Hotspot[]>([]);
  const [district, setDistrict] = useState("");
  const [risk, setRisk] = useState("");
  const [selected, setSelected] = useState<Hotspot | null>(null);
  useEffect(() => {
    fetch("/data/analysis/hotspots.json").then((r) => r.json()).then(setRows).catch(() => setRows([]));
  }, []);
  const districts = useMemo(() => [...new Set(rows.map((r) => r.district || r.area || ""))].filter(Boolean).sort(), [rows]);
  const filtered = rows.filter((r) => (!district || (r.district || r.area) === district) && (!risk || r.risk_level === risk));
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_320px]">
      <div>
        <h1 className="text-2xl font-bold text-[#17324D]">Street-wise hotspot map</h1>
        <p className="mt-1 text-sm text-[#64748B]">These cells are the existing Module 1 output: about 1 km grids from the Karnataka report file. A nearest street is shown only when the pipeline already matched one. A blank lighting tag means the source did not record it.</p>
        <div className="mt-3 flex gap-2">
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={district} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">All districts</option>
            {districts.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select className="rounded-lg border bg-white px-2 py-2 text-sm" value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="">All risk labels</option>
            <option>High</option><option>Medium</option><option>Low</option>
          </select>
        </div>
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
