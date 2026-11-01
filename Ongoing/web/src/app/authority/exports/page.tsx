"use client";

import { useState } from "react";

export default function ExportsPage() {
  const [message, setMessage] = useState("");
  async function download(kind: string) {
    setMessage("");
    const res = await fetch(`/api/suraksha/exports?kind=${kind}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Export is not available for this role.");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `suraksha-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#0B1D33]">Reports and Exports</h1>
      <p className="text-sm text-[#64748B]">CSV is built from the current store and published analysis files. Private citizen identity fields are not included. Demo and operational rows stay labelled in the source data.</p>
      <div className="flex flex-wrap gap-2">
        <button className="rounded-xl bg-[#0B1D33] px-4 py-2 text-sm font-semibold text-white" onClick={() => download("incidents")}>Incident summary CSV</button>
        <button className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={() => download("hotspots")}>Hotspot cells CSV</button>
        <button className="rounded-xl border px-4 py-2 text-sm font-semibold" onClick={() => download("coverage")}>Coverage CSV</button>
      </div>
      {message && <p className="text-sm text-[#B42318]">{message}</p>}
    </main>
  );
}
