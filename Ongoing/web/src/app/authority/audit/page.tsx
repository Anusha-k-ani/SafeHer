"use client";

import { useEffect, useState } from "react";

export default function AuditPage() {
  const [rows, setRows] = useState<{ id: string; at: string; actor_id: string; action: string; target: string; detail: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/suraksha/inbox").then((r) => r.json()).then((d) => {
      if (!d.ok) setError(d.error || "Sign in required");
      else setRows(d.audit || []);
    });
  }, []);
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#0B1D33]">Audit Logs</h1>
      <p className="text-sm text-[#64748B]">Recent authority actions from the operational store. Citizens cannot read this list.</p>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl border bg-white p-4 text-sm">
          <strong>{row.action}</strong> · {row.target}
          <p className="mt-1 text-[#64748B]">{row.detail}</p>
          <p className="mt-1 text-xs">{row.at} · {row.actor_id}</p>
        </article>
      ))}
      {rows.length === 0 && !error && <p className="text-sm text-[#64748B]">No audit rows for this role.</p>}
    </main>
  );
}
