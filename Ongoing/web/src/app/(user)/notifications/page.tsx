"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notices, setNotices] = useState<{ id: string; title: string; body: string; created_at: string; delivery: string }[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/suraksha/inbox").then((r) => r.json()).then((d) => {
      if (!d.ok) setError("Sign in to see in-app notices.");
      else setNotices(d.notices || []);
    });
  }, []);
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-bold text-[#0B1D33]">Notifications</h1>
      <p className="text-sm text-[#64748B]">These are stored in-app notices. They are not SMS, email or push.</p>
      {error && <p className="text-sm text-[#B42318]">{error} <Link href="/login" className="underline">Login</Link></p>}
      {notices.map((note) => (
        <article key={note.id} className="rounded-2xl border bg-white p-4">
          <strong>{note.title}</strong>
          <p className="mt-1 text-sm text-[#64748B]">{note.body}</p>
          <p className="mt-2 text-xs text-[#94A3B8]">{new Date(note.created_at).toLocaleString("en-IN")} · {note.delivery}</p>
        </article>
      ))}
      {notices.length === 0 && !error && <p className="text-sm text-[#64748B]">No notices yet.</p>}
    </main>
  );
}
