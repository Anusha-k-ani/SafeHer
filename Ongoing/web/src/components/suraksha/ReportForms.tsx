"use client";

import { FormEvent, useEffect, useState } from "react";
import { INCIDENT_CATEGORIES, LIGHT_FAULTS } from "@/lib/suraksha/domain";

function localDateTime(date = new Date()) {
  return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

async function locate(): Promise<{ lat: number | null; lon: number | null; error: string | null }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { lat: null, lon: null, error: "This browser cannot read a location. You can type coordinates or continue without them." };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, error: null }),
      () => resolve({ lat: null, lon: null, error: "Location permission was denied. The report can still be saved without a road match." }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export function IncidentForm() {
  const [when, setWhen] = useState<"now" | "past">("now");
  const [category, setCategory] = useState<string>(INCIDENT_CATEGORIES[0]);
  const [occurred, setOccurred] = useState("");
  const [nowLabel, setNowLabel] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (when === "now") setNowLabel(localDateTime());
  }, [when]);

  async function useGps() {
    const fix = await locate();
    setNote(fix.error || "Location filled from this device.");
    if (fix.lat != null) setLat(String(fix.lat));
    if (fix.lon != null) setLon(String(fix.lon));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResult("");
    const captured = new Date();
    if (when === "now") setNowLabel(localDateTime(captured));
    const res = await fetch("/api/suraksha/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        when,
        occurred_at: when === "past" && occurred ? new Date(occurred).toISOString() : captured.toISOString(),
        description,
        lat: lat ? Number(lat) : null,
        lon: lon ? Number(lon) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not save the report. Sign in with the citizen account.");
      return;
    }
    setResult(`${data.report.id} is submitted. Street segment: ${data.report.location.note}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-[#17324D]">Report an incident</h1>
      <label className="block text-sm font-semibold">
        When
        <select className="mt-1 w-full rounded-lg border border-[#D8E0E8] bg-white px-3 py-2" value={when} onChange={(e) => setWhen(e.target.value as "now" | "past")}>
          <option value="now">Happening now</option>
          <option value="past">Happened in the past</option>
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Incident type
        <select className="mt-1 w-full rounded-lg border border-[#D8E0E8] bg-white px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
          {INCIDENT_CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      {when === "now" ? (
        <label className="block text-sm font-semibold">
          Date and time
          <input readOnly className="mt-1 w-full rounded-lg border border-[#D8E0E8] bg-[#F5F7FA] px-3 py-2" value={nowLabel} />
        </label>
      ) : (
        <label className="block text-sm font-semibold">
          Date and time of the incident
          <input type="datetime-local" className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" value={occurred} onChange={(e) => setOccurred(e.target.value)} required />
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm font-semibold">Latitude<input className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" /></label>
        <label className="text-sm font-semibold">Longitude<input className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" value={lon} onChange={(e) => setLon(e.target.value)} inputMode="decimal" /></label>
      </div>
      <button type="button" onClick={useGps} className="rounded-lg border border-[#D8E0E8] bg-white px-3 py-2 text-sm font-semibold text-[#17324D]">Use my location</button>
      {note && <p className="text-sm text-[#64748B]">{note}</p>}
      <label className="block text-sm font-semibold">
        Short description (optional)
        <textarea className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {result && <p className="rounded-lg bg-[#F0FDF4] p-3 text-sm text-[#15803D]">{result}</p>}
      <button className="h-12 w-full rounded-xl bg-[#0F766E] font-semibold text-white" type="submit">Submit report</button>
    </form>
  );
}

export function StreetlightForm() {
  const [fault, setFault] = useState<string>(LIGHT_FAULTS[0]);
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/suraksha/lights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fault, description, lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Sign in with the citizen account first.");
      return;
    }
    setResult(`${data.light.id} is recorded. ${data.light.location.note} A municipality has not been contacted yet.`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-[#17324D]">Report a streetlight problem</h1>
      <label className="block text-sm font-semibold">
        Fault
        <select className="mt-1 w-full rounded-lg border border-[#D8E0E8] bg-white px-3 py-2" value={fault} onChange={(e) => setFault(e.target.value)}>
          {LIGHT_FAULTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm font-semibold">Latitude<input className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" value={lat} onChange={(e) => setLat(e.target.value)} /></label>
        <label className="text-sm font-semibold">Longitude<input className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" value={lon} onChange={(e) => setLon(e.target.value)} /></label>
      </div>
      <button
        type="button"
        className="rounded-lg border border-[#D8E0E8] bg-white px-3 py-2 text-sm font-semibold"
        onClick={async () => {
          const fix = await locate();
          setNote(fix.error || "Location filled from this device.");
          if (fix.lat != null) setLat(String(fix.lat));
          if (fix.lon != null) setLon(String(fix.lon));
        }}
      >
        Use my location
      </button>
      {note && <p className="text-sm text-[#64748B]">{note}</p>}
      <label className="block text-sm font-semibold">
        Description (optional)
        <textarea className="mt-1 w-full rounded-lg border border-[#D8E0E8] px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      {error && <p className="text-sm text-[#B42318]">{error}</p>}
      {result && <p className="rounded-lg bg-[#F0FDF4] p-3 text-sm text-[#15803D]">{result}</p>}
      <button className="h-12 w-full rounded-xl bg-[#0F766E] font-semibold text-white" type="submit">Submit streetlight report</button>
    </form>
  );
}
