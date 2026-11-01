"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Siren } from "lucide-react";

export type SosResult = { ok: true; text: string } | { ok: false; text: string };

async function sendAlert(): Promise<SosResult> {
  let lat: number | null = null;
  let lon: number | null = null;
  let locationNote = "Location was not shared.";
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000 });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      locationNote = "Device coordinates were attached. A readable place name is added when OpenStreetMap can resolve it.";
    } catch {
      locationNote = "Location permission was denied or unavailable. The alert was saved without GPS coordinates.";
    }
  }
  const res = await fetch("/api/suraksha/sos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat, lon }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { ok: false, text: data.error || "Sign in as a citizen, then try again. If you are in danger, call 112." };
  }
  const place = data.alert?.location ? `${data.alert.id} received. ${locationNote}` : `${data.alert.id} received.`;
  return { ok: true, text: `${place} ${data.alert.user_message}` };
}

export function RiskAlertButton({ compact = false, dock = false }: { compact?: boolean; dock?: boolean }) {
  const [phase, setPhase] = useState<"idle" | "armed" | "sending">("idle");
  const [left, setLeft] = useState(3);
  const [result, setResult] = useState<SosResult | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  function disarm() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setPhase("idle");
    setLeft(3);
  }

  async function press() {
    if (phase === "sending") return;
    if (phase === "idle") {
      setResult(null);
      setPhase("armed");
      setLeft(3);
      timer.current = window.setInterval(() => {
        setLeft((n) => {
          if (n <= 1) {
            disarm();
            return 3;
          }
          return n - 1;
        });
      }, 1000);
      return;
    }
    if (timer.current) window.clearInterval(timer.current);
    setPhase("sending");
    try {
      setResult(await sendAlert());
    } catch {
      setResult({ ok: false, text: "The alert could not be sent. If you are in danger, call 112." });
    } finally {
      setPhase("idle");
      setLeft(3);
    }
  }

  const label = phase === "sending" ? "Sending alert" : phase === "armed" ? `Press again to confirm (${left}s)` : "Risk Alert";
  return (
    <div className={dock ? "risk-dock-inner" : compact ? "" : "space-y-3"}>
      <button
        type="button"
        onClick={press}
        disabled={phase === "sending"}
        aria-label={label}
        className={`risk-button ${phase === "armed" ? "risk-button-armed" : ""} ${dock ? "risk-button-dock" : compact ? "h-20" : "h-28"}`}
      >
        <Siren className={dock ? "h-5 w-5" : compact ? "h-7 w-7" : "h-9 w-9"} aria-hidden />
        <span>{label}</span>
      </button>
      <p className={dock ? "risk-dock-note" : "text-sm text-white/80"}>
        {dock
          ? "Two presses. Does not call 112."
          : "First press arms the alert. Second press within 3 seconds sends it to the connected authority workspace. This does not call 112."}
      </p>
      {result && <p className={`text-sm ${result.ok ? "text-teal-100" : "text-red-200"}`}>{result.text}</p>}
    </div>
  );
}

export function RiskAlertDock() {
  const pathname = usePathname();
  if (pathname === "/sos") return null;
  return (
    <div className="risk-dock" role="region" aria-label="Risk Alert">
      <RiskAlertButton dock />
    </div>
  );
}
