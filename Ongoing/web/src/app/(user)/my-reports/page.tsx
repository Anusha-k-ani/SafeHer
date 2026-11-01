"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { label, Pill, toneFor } from "@/components/suraksha/ui";
import { formatLocation } from "@/lib/suraksha/domain";

export default function MyReportsPage() {
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<{ id: string; category: string; status: string; when: string; occurred_at: string; location: { note: string; display_name?: string | null; street_name?: string | null; district?: string | null } }[]>([]);
  const [lights, setLights] = useState<{ id: string; fault: string; status: string }[]>([]);
  const [alerts, setAlerts] = useState<{ id: string; status: string; user_message: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/suraksha/reports").then((r) => r.json()),
      fetch("/api/suraksha/lights").then((r) => r.json()),
      fetch("/api/suraksha/sos").then((r) => r.json()),
    ]).then(([a, b, c]) => {
      if (!a.ok) {
        setError("Sign in with the citizen account to see your reports.");
        return;
      }
      setReports(a.reports || []);
      setLights(b.lights || []);
      setAlerts(c.alerts || []);
    });
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-[#17324D]">My reports</h1>
      <input className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Search your reports" value={query} onChange={(e) => setQuery(e.target.value)} />
      {error && <p className="text-sm text-[#B42318]">{error} <Link className="underline" href="/login">Login</Link></p>}
      {!error && reports.length === 0 && (
        <p className="text-sm text-[#64748B]">No reports yet. <Link className="font-semibold text-teal-700" href="/report/incident">Report an incident</Link>.</p>
      )}
      {alerts.map((item) => (
        <article key={item.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{item.id}</strong><Pill tone={toneFor(item.status)}>{label(item.status)}</Pill></div>
          <p className="mt-2 text-sm text-[#64748B]">{item.user_message}</p>
        </article>
      ))}
      {reports.filter((item) => `${item.id} ${item.category} ${formatLocation(item.location)}`.toLowerCase().includes(query.toLowerCase())).map((item) => (
        <article key={item.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{item.id}</strong><Pill tone={toneFor(item.status)}>{label(item.status)}</Pill></div>
          <p className="mt-2 text-sm">{item.category}</p>
          <p className="mt-1 text-sm text-[#64748B]">{item.when === "now" ? "Happening now" : "Past incident"} | {item.occurred_at ? new Date(item.occurred_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
          <p className="mt-1 text-xs text-[#64748B]">{formatLocation(item.location)}</p>
        </article>
      ))}
      {lights.map((item) => (
        <article key={item.id} className="rounded-xl border border-[#D8E0E8] bg-white p-4">
          <div className="flex items-center justify-between"><strong>{item.id}</strong><Pill tone={toneFor(item.status)}>{label(item.status)}</Pill></div>
          <p className="mt-2 text-sm">{item.fault}</p>
        </article>
      ))}
    </div>
  );
}
