"use client";

import { useState } from "react";
import { Phone } from "lucide-react";

export type SosResult = { ok: true; text: string } | { ok: false; text: string };

export async function sendEmergencyAlert(): Promise<SosResult> {
  let lat: number | null = null;
  let lon: number | null = null;
  let locationNote = "Location was not available.";
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 2500,
          maximumAge: 60000,
        });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      locationNote = "Device location was attached.";
    } catch {
      locationNote = "Location was not shared. The alert was still saved.";
    }
  }
  const res = await fetch("/api/suraksha/sos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      text: data.error || "Sign in as the citizen, then tap again. If you are in danger, call 112.",
    };
  }
  return { ok: true, text: `${data.alert.id}. ${locationNote} ${data.alert.user_message}` };
}

export function useEmergencyAlert() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SosResult | null>(null);

  async function tap() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(await sendEmergencyAlert());
    } catch {
      setResult({ ok: false, text: "The alert could not be sent. If you are in danger, call 112." });
    } finally {
      setBusy(false);
    }
  }

  return { busy, result, tap };
}

export function SosHomeCard() {
  const { busy, result, tap } = useEmergencyAlert();
  return (
    <div className="rounded-2xl border border-[#B42318] bg-[#FEF2F2] p-4">
      <button
        type="button"
        onClick={tap}
        disabled={busy}
        className="flex w-full items-start gap-4 text-left disabled:opacity-70"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#B42318] text-white">
          <Phone className="h-6 w-6" aria-hidden />
        </span>
        <span>
          <span className="block text-lg font-bold text-[#17324D]">{busy ? "Sending alert..." : "SOS Emergency"}</span>
          <span className="mt-1 block text-sm text-[#64748B]">One tap sends the emergency alert. Location is added if you have already allowed it. This does not call a live control room.</span>
        </span>
      </button>
      {result && (
        <p className={`mt-3 text-sm ${result.ok ? "text-[#1F2937]" : "text-[#B42318]"}`}>{result.text}</p>
      )}
    </div>
  );
}
