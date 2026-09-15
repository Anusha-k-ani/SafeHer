"use client";

import { useEffect, useState } from "react";
import { Phone, MapPin, Share2, AlertTriangle, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openDefaultSmsApp } from "@/lib/sms";

const HELPLINES = [
  {
    name: "National Emergency",
    number: "112",
    description: "Police · Fire · Ambulance",
  },
  {
    name: "Women Helpline",
    number: "1091",
    description: "24×7 women in distress",
  },
  {
    name: "Police",
    number: "100",
    description: "Local police emergency",
  },
  {
    name: "Women Helpline (state)",
    number: "181",
    description: "State women support line",
  },
  {
    name: "Ambulance",
    number: "108",
    description: "Emergency medical services",
  },
  {
    name: "Childline",
    number: "1098",
    description: "Children in need of care",
  },
];

const TRUSTED_KEY = "safeher_trusted_contact";

function buildMessage(lat: number, lon: number) {
  const link = `https://maps.google.com/?q=${lat},${lon}`;
  return `EMERGENCY — I need help.\nLive location: ${link}\nCoordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}\nSent via SafeHer.`;
}

export default function EmergencyPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [trusted, setTrusted] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TRUSTED_KEY);
      if (saved) setTrusted(saved);
    } catch {
      /* ignore */
    }
  }, []);

  function saveTrusted() {
    const cleaned = trusted.replace(/[^\d+]/g, "").trim();
    localStorage.setItem(TRUSTED_KEY, cleaned);
    setStatus(
      cleaned
        ? "Trusted contact saved in this browser."
        : "Trusted contact cleared."
    );
  }

  function withLocation(then: (lat: number, lon: number, msg: string) => void) {
    setStatus(null);
    if (!navigator.geolocation) {
      setStatus("Location is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        then(lat, lon, buildMessage(lat, lon));
      },
      () =>
        setStatus("Could not get your location. Allow GPS and try again."),
      { enableHighAccuracy: true }
    );
  }

  function shareLocation() {
    withLocation(async (_lat, _lon, text) => {
      try {
        if (navigator.share) {
          await navigator.share({ title: "SafeHer live location", text });
          setStatus("Share sheet opened — send to police or a trusted contact.");
        } else {
          await navigator.clipboard.writeText(text);
          setStatus(
            "Location message copied. Paste into SMS/WhatsApp for police."
          );
        }
      } catch {
        setStatus("Share cancelled.");
      }
    });
  }

  function smsPolice() {
    withLocation(async (_lat, _lon, text) => {
      const result = await openDefaultSmsApp("100", text);
      setStatus(
        result === "opened"
          ? "Opening your messaging app to Police (100) with your location…"
          : "No SMS app on this computer — message copied. Open this page on your phone and tap SMS Police, or paste into Messages."
      );
    });
  }

  function smsTrusted() {
    const n = trusted.replace(/[^\d+]/g, "");
    if (!n) {
      setStatus("Save a trusted contact number first.");
      return;
    }
    withLocation(async (_lat, _lon, text) => {
      const result = await openDefaultSmsApp(n, text);
      setStatus(
        result === "opened"
          ? `Opening your messaging app to ${n}…`
          : `No SMS app on this computer — message copied for ${n}. Open on your phone to send SMS, or paste into Messages.`
      );
    });
  }

  function callAndShare(number: string) {
    window.location.href = `tel:${number}`;
    setTimeout(() => shareLocation(), 800);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-28 sm:px-6">
      <div className="rounded-2xl bg-[#7F1D1D] p-6 text-white">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-1 h-6 w-6 shrink-0" />
          <div>
            <h1 className="text-2xl font-extrabold">Emergency SOS</h1>
            <p className="mt-2 text-sm text-[#FECACA]">
              Call a helpline, then SMS / share your live Google Maps location
              with police (100) or a trusted contact.
            </p>
          </div>
        </div>
      </div>

      <a
        href="tel:112"
        onClick={() => setTimeout(() => shareLocation(), 800)}
        className="flex h-14 w-full flex-col items-center justify-center rounded-2xl border-2 border-[#FECACA] bg-[#991B1B] text-white"
      >
        <span className="text-sm font-black tracking-wide">
          CALL 112 + SHARE LOCATION
        </span>
        <span className="text-xs text-[#FECACA]">National emergency</span>
      </a>

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={smsPolice}
          className="h-14 rounded-2xl bg-[#E02424] text-base hover:bg-[#C81E1E]"
        >
          <Share2 className="h-5 w-5" /> SMS Police (100)
        </Button>
        <Button
          onClick={shareLocation}
          variant="outline"
          className="h-14 rounded-2xl border-[#FECACA] text-base text-[#991B1B]"
        >
          <Share2 className="h-5 w-5" /> WhatsApp / Share
        </Button>
      </div>

      {status && (
        <p className="rounded-xl bg-[#F5F3FF] px-4 py-3 text-sm text-[#5B21B6]">
          {status}
        </p>
      )}

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#7C3AED]" />
          <h2 className="font-extrabold text-[#111827]">Trusted contact</h2>
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">
          Optional family / friend number for one-tap location SMS.
        </p>
        <input
          value={trusted}
          onChange={(e) => setTrusted(e.target.value)}
          placeholder="e.g. +91 98XXXXXXXX"
          className="mt-3 w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={saveTrusted}
          >
            Save
          </Button>
          <Button
            type="button"
            className="rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"
            onClick={smsTrusted}
          >
            SMS trusted contact
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-[#111827]">
          Helpline numbers
        </h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          Tap Call to dial. Call + share opens dialer then location share.
        </p>
        <div className="mt-4 space-y-3">
          {HELPLINES.map((h) => (
            <div
              key={h.number}
              className="flex flex-col gap-3 rounded-2xl border border-[#FECACA] bg-[#FFF7F7] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-[#111827]">{h.name}</p>
                <p className="text-2xl font-extrabold text-[#E02424]">
                  {h.number}
                </p>
                <p className="text-sm text-[#6B7280]">{h.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:${h.number}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E02424] px-4 py-3 text-sm font-bold text-white"
                >
                  <Phone className="h-4 w-4" /> Call
                </a>
                <button
                  type="button"
                  onClick={() => callAndShare(h.number)}
                  className="inline-flex items-center justify-center rounded-xl border border-[#FECACA] bg-white px-4 py-3 text-sm font-bold text-[#991B1B]"
                >
                  Call + share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm text-[#6B7280]">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7C3AED]" />
          Sharing sends a Google Maps link of your current GPS via SMS or the
          share menu. This does not plug into police dispatch systems — it helps
          you contact them quickly with your pin.
        </p>
      </div>
    </div>
  );
}
