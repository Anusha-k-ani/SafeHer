"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Shield, AlertTriangle, CheckCircle, Megaphone } from "lucide-react";
import {
  loadCommunitySummary,
  communityLevel,
  communityScore,
  type CommunitySummary,
} from "@/lib/reports";

export function UserSafetyGlance() {
  const [summary, setSummary] = useState<CommunitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await loadCommunitySummary();
        if (!cancelled) setSummary(s);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const score =
    summary != null
      ? communityScore(summary.pctSafe, summary.avgRating)
      : null;
  const level = score != null ? communityLevel(score) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 pb-28 sm:px-6 md:pb-10">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
          Community safety
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#111827]">
          How Bengaluru feels right now
        </h1>
        <p className="mt-2 text-[#6B7280]">
          A simple glance from anonymous community reports. For full analytics,
          use the admin portal.
        </p>
      </div>

      {loading ? (
        <p className="text-[#6B7280]">Loading community data…</p>
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#EDE9FE] bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">
              Overall vibe
            </p>
            <p
              className="mt-2 text-2xl font-extrabold"
              style={{
                color:
                  level === "Safe"
                    ? "#0E9F6E"
                    : level === "Moderate"
                      ? "#D97706"
                      : "#E02424",
              }}
            >
              {level ?? "—"}
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              Score {score?.toFixed(1)} / 10 · {summary.pctSafe}% marked safe
            </p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">Reports</p>
            <p className="mt-2 text-2xl font-extrabold text-[#111827]">
              {summary.totalReports.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-[#6B7280]">
              {summary.liveReports?.toLocaleString() ?? 0} live ·{" "}
              {summary.areasCovered} areas
            </p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 sm:col-span-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#0E9F6E]">
                <CheckCircle className="h-4 w-4" />
                {summary.safeReports.toLocaleString()} safe
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#E02424]">
                <AlertTriangle className="h-4 w-4" />
                {summary.unsafeReports.toLocaleString()} unsafe / incidents
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#6B7280]">
                <MapPin className="h-4 w-4" />
                {summary.areasCovered} BBMP areas
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[#6B7280]">Couldn’t load community data.</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/report"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] text-sm font-semibold text-white hover:bg-[#6D28D9]"
        >
          <Megaphone className="h-4 w-4" /> Share a report
        </Link>
        <Link
          href="/map"
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white text-sm font-semibold text-[#374151]"
        >
          <Shield className="h-4 w-4" /> Open map
        </Link>
      </div>
    </div>
  );
}
