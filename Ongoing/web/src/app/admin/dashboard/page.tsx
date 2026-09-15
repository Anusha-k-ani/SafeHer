import fs from "fs";
import path from "path";
import Link from "next/link";
import { MapPin, Shield, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import {
  FactorAveragesChart,
  QuickActions,
  SafetyLevelChart,
  ScoreHistogram,
  TopAreasChart,
} from "@/components/dashboard/Charts";
import type { AreaSummary, SummaryData } from "@/lib/types";
import { DashboardMonitor } from "@/components/dashboard/MonitorPanel";

function loadData() {
  const base = path.join(process.cwd(), "public/data");
  const summary = JSON.parse(
    fs.readFileSync(path.join(base, "summary.json"), "utf-8")
  ) as SummaryData;
  const areas = JSON.parse(
    fs.readFileSync(path.join(base, "areas.json"), "utf-8")
  ) as AreaSummary[];
  let analysis: { hotspot_count?: number; alert_count?: number } | null = null;
  const analysisPath = path.join(base, "analysis", "summary.json");
  if (fs.existsSync(analysisPath)) {
    analysis = JSON.parse(fs.readFileSync(analysisPath, "utf-8"));
  }
  return { summary, areas, analysis };
}

export default function AdminDashboardPage() {
  const { summary, areas, analysis } = loadData();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
            SafeHer Admin · OSM infrastructure
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#111827]">
            Street safety data
          </h1>
          <p className="mt-2 max-w-2xl text-[#6B7280]">
            OpenStreetMap infrastructure scores across {summary.areasCovered}{" "}
            BBMP areas — {summary.totalStreets.toLocaleString()} streets using a
            9-factor model.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/hotspots"
            className="inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
          >
            Hotspots & alerts
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151]"
          >
            Community Analytics
          </Link>
          <Link
            href="/admin/map"
            className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151]"
          >
            Open Map
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Streets"
          value={summary.totalStreets.toLocaleString()}
          subtitle={`${summary.areasCovered} BBMP areas`}
          icon={MapPin}
        />
        <KpiCard
          title="Avg Safety Score"
          value={summary.avgSafetyScore.toFixed(2)}
          subtitle="Out of 10"
          icon={Activity}
          accent="#1A56DB"
        />
        <KpiCard
          title="Safe Streets"
          value={summary.safe.toLocaleString()}
          subtitle={pct(summary.safe, summary.totalStreets)}
          icon={CheckCircle}
          accent="#0E9F6E"
        />
        <KpiCard
          title="Unsafe Streets"
          value={summary.unsafe.toLocaleString()}
          subtitle={pct(summary.unsafe, summary.totalStreets)}
          icon={AlertTriangle}
          accent="#E02424"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Moderate"
          value={summary.moderate.toLocaleString()}
          subtitle={pct(summary.moderate, summary.totalStreets)}
          icon={Shield}
          accent="#D97706"
        />
        <KpiCard
          title="CCTV Coverage"
          value={`${summary.cctvCoveragePct}%`}
          subtitle="Streets with camera within 300m"
          icon={Shield}
        />
        <KpiCard
          title="Avg Police Distance"
          value={`${(summary.avgPoliceDistance / 1000).toFixed(1)} km`}
          subtitle={`Hospital: ${summary.avgHospitalDistance}m avg`}
          icon={MapPin}
        />
      </div>

      {analysis && (
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            title="Incident hotspots"
            value={String(analysis.hotspot_count ?? 0)}
            subtitle="~1 km clusters from app reports"
            icon={AlertTriangle}
            accent="#E02424"
          />
          <KpiCard
            title="Patrol alerts"
            value={String(analysis.alert_count ?? 0)}
            subtitle="High-risk or recently active cells"
            icon={Activity}
            accent="#7C3AED"
          />
        </div>
      )}

      <QuickActions />

      <DashboardMonitor />

      <div className="grid gap-6 lg:grid-cols-2">
        <SafetyLevelChart summary={summary} />
        <ScoreHistogram summary={summary} />
      </div>

      <TopAreasChart areas={areas} />
      <FactorAveragesChart summary={summary} />

      <p className="text-center text-xs text-[#6B7280]">
        Data generated: {summary.generatedOn}
      </p>
    </div>
  );
}
