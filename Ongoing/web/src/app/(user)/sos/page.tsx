"use client";

import Link from "next/link";
import { useEmergencyAlert } from "@/components/suraksha/SosTap";

export default function SosPage() {
  const { busy, result, tap } = useEmergencyAlert();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-bold text-[#17324D]">SOS</h1>
      <p className="mt-2 text-sm text-[#64748B]">One tap sends the emergency alert. If you are in immediate danger, call 112. This records the alert inside SurakshaSetu. It does not contact a live police control room.</p>
      <button type="button" disabled={busy} onClick={tap} className="mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-[#B42318] text-lg font-bold text-white disabled:opacity-60">
        {busy ? "Sending alert..." : "SOS Emergency"}
      </button>
      <a href="tel:112" className="mt-3 flex h-12 items-center justify-center rounded-xl border border-[#D8E0E8] bg-white font-semibold text-[#17324D]">Call 112</a>
      {result && <p className={`mt-4 rounded-lg bg-white p-3 text-sm ${result.ok ? "text-[#1F2937]" : "text-[#B42318]"}`}>{result.text}</p>}
      <Link href="/my-reports" className="mt-4 inline-block text-sm font-semibold text-[#0F766E]">My reports</Link>
    </div>
  );
}
