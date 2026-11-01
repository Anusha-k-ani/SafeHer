"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatLocation } from "@/lib/suraksha/domain";
import { label, Pill, toneFor } from "./ui";
import type { SessionUser } from "@/lib/suraksha/session-context";

export function CitizenHome({ user }: { user: SessionUser }) {
  const [reports, setReports] = useState<{ id: string; category: string; status: string; created_at: string; location: Parameters<typeof formatLocation>[0] }[]>([]);
  const [notices, setNotices] = useState<{ id: string; title: string; body: string }[]>([]);
  useEffect(() => {
    fetch("/api/suraksha/reports").then((r) => r.json()).then((d) => setReports(d.reports || [])).catch(() => undefined);
    fetch("/api/suraksha/inbox").then((r) => r.json()).then((d) => setNotices((d.notices || []).slice(0, 4))).catch(() => undefined);
  }, []);
  return (
    <div className="bg-[#F3F7FB]">
      <section className="bg-[#0B1D33] px-4 py-10 text-white sm:px-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-teal-300">Welcome back, {user.name}</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-tight">Every Street Deserves to Feel Safe.</h1>
          <p className="mt-3 text-white/70">Report a concern, send a Risk Alert from the button at the bottom of any page, or review the status of your own records.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/report/incident" className="rounded-xl bg-teal-400 px-4 py-3 text-sm font-semibold text-[#062017]">Report an incident</Link>
            <Link href="/map" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold">Safety map</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-[#0B1D33]">Your recent reports</h2>
          {reports.length === 0 && (
            <p className="mt-3 rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm text-[#64748B]">
              No reports yet. <Link className="font-semibold text-teal-700" href="/report/incident">File the first one</Link>.
            </p>
          )}
          {reports.slice(0, 4).map((row) => (
            <article key={row.id} className="mt-3 rounded-2xl border border-[#D8E0E8] bg-white p-4">
              <div className="flex justify-between"><strong>{row.id}</strong><Pill tone={toneFor(row.status)}>{label(row.status)}</Pill></div>
              <p className="mt-1 text-sm">{row.category}</p>
              <p className="mt-1 text-xs text-[#64748B]">{formatLocation(row.location)}</p>
            </article>
          ))}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0B1D33]">Notifications</h2>
          <p className="mt-1 text-xs text-[#64748B]">In-app notices only. Nothing is sent to a phone.</p>
          {notices.map((note) => (
            <article key={note.id} className="mt-3 rounded-2xl border border-[#D8E0E8] bg-white p-4">
              <strong>{note.title}</strong>
              <p className="mt-1 text-sm text-[#64748B]">{note.body}</p>
            </article>
          ))}
          <Link href="/resources" className="mt-4 inline-block text-sm font-semibold text-teal-700">Safety resources</Link>
        </div>
      </section>
    </div>
  );
}
