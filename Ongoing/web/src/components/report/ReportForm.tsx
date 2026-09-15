"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  AlertTriangle,
  MapPin,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveArea, getTimeOfDay } from "@/lib/areas";
import {
  INCIDENT_OPTIONS,
  type FeelingChoice,
  type IncidentType,
} from "@/lib/incidents";
import { submitReport } from "@/lib/reports";
import { isSupabaseConfigured as supabaseReady } from "@/lib/supabase";

type LocState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; lat: number; lon: number; area: string }
  | { status: "error"; message: string };

type Step = 1 | 2 | 3 | 4;

export function ReportForm() {
  const [step, setStep] = useState<Step>(1);
  const [loc, setLoc] = useState<LocState>({ status: "idle" });
  const [choice, setChoice] = useState<FeelingChoice | null>(null);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [rating, setRating] = useState(3);
  const [lightingOk, setLightingOk] = useState(false);
  const [policeNearby, setPoliceNearby] = useState(false);
  const [cctvSeen, setCctvSeen] = useState(false);
  const [transportNearby, setTransportNearby] = useState(false);
  const [harassmentReported, setHarassmentReported] = useState(false);
  const [crowdLevel, setCrowdLevel] = useState(3);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIncident = choice === "incident";

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLoc({
        status: "error",
        message: "Location isn’t available in this browser.",
      });
      return;
    }
    setLoc({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const area = await resolveArea(lat, lon);
        setLoc({ status: "ready", lat, lon, area });
      },
      (err) => {
        setLoc({
          status: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Please allow location access, then try again."
              : "Couldn’t get your location. Try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const progress = useMemo(() => ((step - 1) / 3) * 100, [step]);

  function resetAll() {
    setStep(1);
    setChoice(null);
    setIncidentType(null);
    setComment("");
    setLightingOk(false);
    setPoliceNearby(false);
    setCctvSeen(false);
    setTransportNearby(false);
    setHarassmentReported(false);
    setRating(3);
    setCrowdLevel(3);
    setError(null);
    fetchLocation();
  }

  function canContinueFromStep2() {
    if (!choice) return false;
    if (choice === "incident" && !incidentType) return false;
    return true;
  }

  async function doSubmit() {
    setError(null);
    if (!supabaseReady()) {
      setError("Backend not configured. Ask your team to set Supabase keys.");
      return;
    }
    if (loc.status !== "ready" || !choice) {
      setError("Location or safety choice is missing.");
      return;
    }
    if (choice === "incident" && !incidentType) {
      setError("Please choose what kind of incident happened.");
      return;
    }
    setSubmitting(true);
    const res = await submitReport({
      lat: loc.lat,
      lon: loc.lon,
      area: loc.area,
      is_safe: choice === "safe",
      report_kind: choice === "incident" ? "incident" : "feeling",
      incident_type: choice === "incident" ? incidentType : null,
      safety_rating: choice === "incident" ? Math.min(rating, 2) : rating,
      lighting_ok: lightingOk,
      police_nearby: policeNearby,
      cctv_seen: cctvSeen,
      transport_nearby: transportNearby,
      harassment_reported: harassmentReported,
      crowd_level: crowdLevel,
      comment: comment || null,
      time_of_day: getTimeOfDay(),
    });
    setSubmitting(false);
    if (res.ok) setStep(4);
    else setError(res.error);
  }

  const chips = [
    { label: "Good lighting", checked: lightingOk, onChange: setLightingOk },
    { label: "Police nearby", checked: policeNearby, onChange: setPoliceNearby },
    { label: "CCTV visible", checked: cctvSeen, onChange: setCctvSeen },
    {
      label: "Transport nearby",
      checked: transportNearby,
      onChange: setTransportNearby,
    },
    {
      label: "Harassment concern",
      checked: harassmentReported,
      onChange: setHarassmentReported,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-xl">
      {step < 4 && (
        <div className="mb-6">
          <div className="h-2 overflow-hidden rounded-full bg-[#EDE9FE]">
            <div
              className="h-full rounded-full bg-[#7C3AED] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-[#9CA3AF]">
            <span className={step >= 1 ? "text-[#7C3AED]" : ""}>1. Location</span>
            <span className={step >= 2 ? "text-[#7C3AED]" : ""}>2. Report</span>
            <span className={step >= 3 ? "text-[#7C3AED]" : ""}>3. Details</span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#EDE9FE] bg-white p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm font-bold text-[#7C3AED]">Step 1 of 3</p>
            <h2 className="text-2xl font-extrabold text-[#111827]">
              Where are you?
            </h2>
            <p className="text-[#6B7280]">
              We only use GPS to name your Bengaluru area. Anonymous by default.
            </p>

            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAF8FF] p-5">
              {loc.status === "loading" || loc.status === "idle" ? (
                <p className="flex items-center gap-2 text-[#374151]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7C3AED]" />
                  Finding your area…
                </p>
              ) : loc.status === "error" ? (
                <div className="space-y-3">
                  <p className="text-[#E02424]">{loc.message}</p>
                  <Button type="button" variant="outline" onClick={fetchLocation}>
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#7C3AED]" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-[#9CA3AF]">
                      You are in
                    </p>
                    <p className="text-2xl font-extrabold text-[#111827]">
                      {loc.area}
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
                    </p>
                    <button
                      type="button"
                      onClick={fetchLocation}
                      className="mt-2 text-sm font-semibold text-[#7C3AED] hover:underline"
                    >
                      Refresh location
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="button"
              disabled={loc.status !== "ready"}
              className="h-12 w-full rounded-xl bg-[#7C3AED] text-base hover:bg-[#6D28D9]"
              onClick={() => setStep(2)}
            >
              Looks right — continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm font-bold text-[#7C3AED]">Step 2 of 3</p>
            <h2 className="text-2xl font-extrabold text-[#111827]">
              What do you want to report?
            </h2>
            <p className="text-[#6B7280]">
              {loc.status === "ready" ? `In ${loc.area} right now` : "Your area"}{" "}
              — share how it feels, or report an incident that happened.
            </p>

            <button
              type="button"
              onClick={() => {
                setChoice("safe");
                setIncidentType(null);
              }}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                choice === "safe"
                  ? "border-[#0E9F6E] bg-[#ECFDF5]"
                  : "border-[#A7F3D0] bg-white hover:bg-[#ECFDF5]/50"
              }`}
            >
              <CheckCircle
                className={`h-10 w-10 ${choice === "safe" ? "text-[#0E9F6E]" : "text-[#9CA3AF]"}`}
              />
              <span>
                <span className="block text-lg font-extrabold text-[#111827]">
                  I feel safe
                </span>
                <span className="text-sm text-[#6B7280]">
                  Lit, busy, or comfortable walking here
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setChoice("unsafe");
                setIncidentType(null);
              }}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                choice === "unsafe"
                  ? "border-[#E02424] bg-[#FEF2F2]"
                  : "border-[#FECACA] bg-white hover:bg-[#FEF2F2]/50"
              }`}
            >
              <AlertTriangle
                className={`h-10 w-10 ${choice === "unsafe" ? "text-[#E02424]" : "text-[#9CA3AF]"}`}
              />
              <span>
                <span className="block text-lg font-extrabold text-[#111827]">
                  I feel unsafe
                </span>
                <span className="text-sm text-[#6B7280]">
                  Dark, isolated, or something felt wrong
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setChoice("incident")}
              className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition ${
                choice === "incident"
                  ? "border-[#C2410C] bg-[#FFF7ED]"
                  : "border-[#FDBA74] bg-white hover:bg-[#FFF7ED]/50"
              }`}
            >
              <AlertTriangle
                className={`h-10 w-10 ${choice === "incident" ? "text-[#C2410C]" : "text-[#9CA3AF]"}`}
              />
              <span>
                <span className="block text-lg font-extrabold text-[#111827]">
                  Something happened
                </span>
                <span className="text-sm text-[#6B7280]">
                  Report an incident — harassment, theft, or other
                </span>
              </span>
            </button>

            {choice === "incident" && (
              <div className="space-y-2 rounded-2xl border border-[#FDBA74] bg-[#FFF7ED] p-4">
                <p className="text-sm font-bold text-[#111827]">
                  What kind of incident?
                </p>
                {INCIDENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setIncidentType(opt.value)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      incidentType === opt.value
                        ? "border-[#C2410C] bg-[#FFEDD5]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    <span className="block text-sm font-bold text-[#111827]">
                      {opt.label}
                    </span>
                    <span className="text-xs text-[#6B7280]">{opt.hint}</span>
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                disabled={!canContinueFromStep2()}
                className="h-12 flex-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"
                onClick={() => setStep(3)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <button
              type="button"
              disabled={!canContinueFromStep2() || submitting}
              onClick={doSubmit}
              className="w-full text-center text-sm font-semibold text-[#7C3AED] hover:underline disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Skip details & submit now"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm font-bold text-[#7C3AED]">
              Step 3 of 3 · optional
            </p>
            <h2 className="text-2xl font-extrabold text-[#111827]">
              {isIncident ? "Add incident details" : "Any extra details?"}
            </h2>
            <p className="text-[#6B7280]">
              {isIncident
                ? "A short note helps others stay alert. Skip anything you don’t want to share."
                : "Helps others understand why. Skip anything you don’t want to share."}
            </p>

            {!isIncident && (
              <div>
                <label className="mb-2 block text-sm font-bold text-[#111827]">
                  Safety rating · {rating}/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full accent-[#7C3AED]"
                />
                <div className="mt-1 flex justify-between text-xs text-[#9CA3AF]">
                  <span>Unsafe</span>
                  <span>Safe</span>
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-bold text-[#111827]">
                How crowded? · {crowdLevel}/5
              </label>
              <input
                type="range"
                min={1}
                max={5}
                value={crowdLevel}
                onChange={(e) => setCrowdLevel(Number(e.target.value))}
                className="w-full accent-[#7C3AED]"
              />
            </div>

            {!isIncident && (
              <div>
                <p className="mb-2 text-sm font-bold text-[#111827]">
                  What did you notice?
                </p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => c.onChange(!c.checked)}
                      className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                        c.checked
                          ? "border-[#7C3AED] bg-[#F5F3FF] text-[#7C3AED]"
                          : "border-[#E5E7EB] bg-white text-[#374151]"
                      }`}
                    >
                      {c.checked ? "✓ " : ""}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-bold text-[#111827]">
                {isIncident ? "What happened? (optional)" : "Note (optional)"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder={
                  isIncident
                    ? "Briefly describe what happened — no personal details"
                    : "Short tip — no personal details"
                }
                className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>

            {isIncident && (
              <Link
                href="/emergency"
                className="block rounded-xl bg-[#FEF2F2] px-3 py-3 text-sm font-bold text-[#E02424] hover:underline"
              >
                In danger now? Open Emergency SOS →
              </Link>
            )}

            {error && (
              <p className="rounded-lg bg-[#FEF2F2] px-3 py-2 text-sm text-[#991B1B]">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="button"
                disabled={submitting}
                className="h-12 flex-1 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"
                onClick={doSubmit}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : isIncident ? (
                  "Submit incident"
                ) : (
                  "Submit report"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFDF5]">
              <CheckCircle className="h-9 w-9 text-[#0E9F6E]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#111827]">Thank you</h2>
            <p className="text-[#6B7280]">
              Your {isIncident ? "incident report" : "report"}
              {loc.status === "ready" ? ` for ${loc.area}` : ""} was shared
              anonymously and helps others plan safer routes.
            </p>
            <Button
              type="button"
              className="h-12 w-full rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9]"
              onClick={resetAll}
            >
              Report again
            </Button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/community"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-sm font-semibold text-[#7C3AED]"
              >
                <Shield className="mr-2 h-4 w-4" /> Community dashboard
              </Link>
              <Link
                href="/map"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151]"
              >
                Open map
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
