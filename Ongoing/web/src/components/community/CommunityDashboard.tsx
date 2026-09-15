"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Activity,
  MapPin,
  Clock,
  Layers,
  TrendingUp,
  TrendingDown,
  Database,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildDashboardAnalytics, type DashboardAnalytics } from "@/lib/analytics";
import {
  aggregateReports,
  loadLiveReportsOnly,
  loadSyntheticReports,
  type SafetyReport,
} from "@/lib/reports";
import type { AreaSummary } from "@/lib/types";

const LEVEL_COLORS = {
  Safe: "#0E9F6E",
  Moderate: "#D97706",
  Unsafe: "#E02424",
};

type SourceMode = "generated" | "real" | "compare";

export function CommunityDashboard() {
  const [synthetic, setSynthetic] = useState<SafetyReport[]>([]);
  const [live, setLive] = useState<SafetyReport[]>([]);
  const [osmAreas, setOsmAreas] = useState<AreaSummary[]>([]);
  const [mode, setMode] = useState<SourceMode>("generated");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      loadSyntheticReports(),
      loadLiveReportsOnly(),
      fetch("/data/areas.json").then((r) => r.json() as Promise<AreaSummary[]>),
    ])
      .then(([syn, real, osm]) => {
        setSynthetic(syn);
        setLive(real);
        setOsmAreas(osm);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const generatedAnalytics = useMemo(() => {
    const { areas } = aggregateReports(synthetic);
    return buildDashboardAnalytics(synthetic, areas, osmAreas);
  }, [synthetic, osmAreas]);

  const realAnalytics = useMemo(() => {
    const { areas } = aggregateReports(live);
    return buildDashboardAnalytics(live, areas, osmAreas);
  }, [live, osmAreas]);

  const active: DashboardAnalytics =
    mode === "real" ? realAnalytics : generatedAnalytics;

  const recent = useMemo(() => {
    const list = mode === "real" ? live : synthetic;
    return list.slice(0, 12);
  }, [mode, live, synthetic]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[#6B7280]">
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#991B1B]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
            SafeHer analytics
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#111827]">
            Safety insights dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-[#6B7280]">
            Generated demo data and real user reports are kept separate so you
            can study each clearly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/report"
            className="inline-flex items-center justify-center rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
          >
            Public report form
          </Link>
          <Link
            href="/admin/map"
            className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#374151]"
          >
            Admin map
          </Link>
        </div>
      </div>

      {/* Source switcher */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-2 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-3">
          <SourceTab
            active={mode === "generated"}
            onClick={() => setMode("generated")}
            icon={Database}
            title="Generated data"
            subtitle={`${synthetic.length.toLocaleString()} synthetic demo reports`}
            accent="violet"
          />
          <SourceTab
            active={mode === "real"}
            onClick={() => setMode("real")}
            icon={Users}
            title="Real user data"
            subtitle={
              live.length > 0
                ? `${live.length.toLocaleString()} live submissions`
                : "No live reports yet — submit from Report"
            }
            accent="green"
          />
          <SourceTab
            active={mode === "compare"}
            onClick={() => setMode("compare")}
            icon={Shield}
            title="Compare both"
            subtitle="Side-by-side generated vs real"
            accent="blue"
          />
        </div>
      </div>

      {mode === "compare" ? (
        <CompareView generated={generatedAnalytics} real={realAnalytics} />
      ) : (
        <>
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              mode === "generated"
                ? "border border-[#DDD6FE] bg-[#F5F3FF] text-[#5B21B6]"
                : "border border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]"
            }`}
          >
            {mode === "generated" ? (
              <>
                Viewing <strong>generated / synthetic</strong> demo reports only.
                These are seeded from OSM area scores for demos and PBL
                presentation — not real user submissions.
              </>
            ) : (
              <>
                Viewing <strong>real user</strong> reports only (from the Report
                form / mobile app via Supabase).
                {live.length === 0
                  ? " Nothing submitted yet — KPIs will fill as people report."
                  : ` ${live.length} live report(s) loaded.`}
              </>
            )}
          </div>

          <AnalyticsBody
            a={active}
            recent={recent}
            emptyReal={mode === "real" && live.length === 0}
            sourceLabel={mode === "generated" ? "Generated" : "Real"}
          />
        </>
      )}
    </div>
  );
}

function SourceTab({
  active,
  onClick,
  icon: Icon,
  title,
  subtitle,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Database;
  title: string;
  subtitle: string;
  accent: "violet" | "green" | "blue";
}) {
  const activeStyles = {
    violet: "border-[#7C3AED] bg-[#F5F3FF] ring-2 ring-[#7C3AED]/20",
    green: "border-[#0E9F6E] bg-[#ECFDF5] ring-2 ring-[#0E9F6E]/20",
    blue: "border-[#1A56DB] bg-[#EBF2FF] ring-2 ring-[#1A56DB]/20",
  };
  const iconColor = {
    violet: "text-[#7C3AED]",
    green: "text-[#0E9F6E]",
    blue: "text-[#1A56DB]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 p-4 text-left transition ${
        active
          ? activeStyles[accent]
          : "border-transparent bg-[#F9FAFB] hover:border-[#E5E7EB]"
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 ${iconColor[accent]}`} />
        <div>
          <p className="font-bold text-[#111827]">{title}</p>
          <p className="mt-0.5 text-xs text-[#6B7280]">{subtitle}</p>
        </div>
      </div>
    </button>
  );
}

function CompareView({
  generated,
  real,
}: {
  generated: DashboardAnalytics;
  real: DashboardAnalytics;
}) {
  const sideBySide = [
    {
      label: "Reports",
      gen: generated.totalReports.toLocaleString(),
      real: real.totalReports.toLocaleString(),
    },
    {
      label: "Community score",
      gen: generated.overallScore.toFixed(2),
      real: real.totalReports ? real.overallScore.toFixed(2) : "—",
    },
    {
      label: "% Safe",
      gen: `${generated.pctSafe}%`,
      real: real.totalReports ? `${real.pctSafe}%` : "—",
    },
    {
      label: "Avg rating",
      gen: generated.avgRating != null ? `${generated.avgRating}/5` : "—",
      real: real.avgRating != null ? `${real.avgRating}/5` : "—",
    },
    {
      label: "Areas covered",
      gen: String(generated.areasCovered),
      real: String(real.areasCovered),
    },
    {
      label: "Unsafe marks",
      gen: generated.unsafeReports.toLocaleString(),
      real: real.unsafeReports.toLocaleString(),
    },
  ];

  const chartRows = [
    {
      metric: "Reports",
      Generated: generated.totalReports,
      Real: real.totalReports,
    },
    {
      metric: "% Safe",
      Generated: generated.pctSafe,
      Real: real.pctSafe,
    },
    {
      metric: "Score×10",
      Generated: Math.round(generated.overallScore * 10) / 10,
      Real: Math.round(real.overallScore * 10) / 10,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#BFDBFE] bg-[#EBF2FF] px-4 py-3 text-sm text-[#1E3A8A]">
        Side-by-side view. <strong>Generated</strong> = synthetic demo dataset.{" "}
        <strong>Real</strong> = live user submissions only. They are never mixed
        in this view.
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="grid grid-cols-3 border-b border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
          <span>Metric</span>
          <span className="text-[#7C3AED]">Generated</span>
          <span className="text-[#0E9F6E]">Real users</span>
        </div>
        {sideBySide.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-3 border-b border-[#F3F4F6] px-4 py-3 text-sm last:border-0"
          >
            <span className="font-medium text-[#374151]">{row.label}</span>
            <span className="font-bold text-[#7C3AED]">{row.gen}</span>
            <span className="font-bold text-[#0E9F6E]">{row.real}</span>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Generated vs Real at a glance</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Generated" fill="#7C3AED" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Real" fill="#0E9F6E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {real.totalReports === 0 && (
        <div className="rounded-xl border border-dashed border-[#A7F3D0] bg-[#ECFDF5] p-6 text-center">
          <p className="font-semibold text-[#065F46]">No real user data yet</p>
          <p className="mt-1 text-sm text-[#047857]">
            Generated demo data is available now. Real columns fill when someone
            submits via Report.
          </p>
          <Link
            href="/report"
            className="mt-4 inline-flex rounded-xl bg-[#0E9F6E] px-4 py-2 text-sm font-semibold text-white"
          >
            Submit the first live report
          </Link>
        </div>
      )}
    </div>
  );
}

function AnalyticsBody({
  a,
  recent,
  emptyReal,
  sourceLabel,
}: {
  a: DashboardAnalytics;
  recent: SafetyReport[];
  emptyReal: boolean;
  sourceLabel: string;
}) {
  if (emptyReal) {
    return (
      <div className="rounded-2xl border border-dashed border-[#A7F3D0] bg-white p-10 text-center">
        <Users className="mx-auto h-10 w-10 text-[#0E9F6E]" />
        <h2 className="mt-4 text-xl font-extrabold text-[#111827]">
          Waiting for real reports
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[#6B7280]">
          This tab only shows live Supabase submissions. Switch to{" "}
          <strong>Generated data</strong> to explore the demo dataset, or submit
          a report to start filling real analytics.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/report"
            className="rounded-xl bg-[#0E9F6E] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Submit a real report
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={`${sourceLabel} reports`}
          value={a.totalReports.toLocaleString()}
          subtitle={`${a.areasCovered} areas covered`}
          icon={MapPin}
          accent={sourceLabel === "Generated" ? "#7C3AED" : "#0E9F6E"}
        />
        <KpiCard
          title="Community Score"
          value={a.overallScore.toFixed(2)}
          subtitle={`${a.overallLevel} overall`}
          icon={Activity}
          accent={LEVEL_COLORS[a.overallLevel]}
        />
        <KpiCard
          title="Marked Safe"
          value={`${a.pctSafe}%`}
          subtitle={`${a.safeReports.toLocaleString()} reports`}
          icon={CheckCircle}
          accent="#0E9F6E"
        />
        <KpiCard
          title="Avg Rating"
          value={a.avgRating != null ? `${a.avgRating}/5` : "—"}
          subtitle={`${a.unsafeReports.toLocaleString()} unsafe marks`}
          icon={AlertTriangle}
          accent="#E02424"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Safe vs Unsafe</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={a.safeUnsafe}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {a.safeUnsafe.map((e) => (
                    <Cell key={e.name} fill={e.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-[#7C3AED]" />
              Time of day
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.timeOfDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="safe" stackId="a" fill="#0E9F6E" name="Safe" />
                <Bar
                  dataKey="unsafe"
                  stackId="a"
                  fill="#E02424"
                  name="Unsafe"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rating distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.ratingDist}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  fill={sourceLabel === "Generated" ? "#7C3AED" : "#0E9F6E"}
                  radius={[6, 6, 0, 0]}
                  name="Reports"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-[#7C3AED]" />
              Factor rates
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.factorRates} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="pct" fill="#8B5CF6" radius={[0, 6, 6, 0]} name="% Yes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">% Safe by area</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={a.topVolume.map((x) => ({
                  area: x.area.length > 12 ? x.area.slice(0, 11) + "…" : x.area,
                  fullArea: x.area,
                  pctSafe: Number(x.pct_safe),
                }))}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis
                  type="category"
                  dataKey="area"
                  width={95}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "% Safe"]}
                  labelFormatter={(_, payload) =>
                    (payload?.[0]?.payload as { fullArea?: string })?.fullArea ??
                    ""
                  }
                />
                <Bar dataKey="pctSafe" radius={[0, 4, 4, 0]}>
                  {a.topVolume.map((x) => (
                    <Cell key={x.area} fill={LEVEL_COLORS[x.level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-[#0E9F6E]" />
              Safest areas ({sourceLabel.toLowerCase()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {a.topSafest.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Not enough data yet.</p>
              ) : (
                a.topSafest.map((area, i) => (
                  <div
                    key={area.area}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECFDF5] text-xs font-bold text-[#065F46]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">
                          {area.area}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {area.report_count} reports · {area.pct_safe}% safe
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-[#0E9F6E] px-2.5 py-0.5 text-xs font-bold text-white">
                      {area.score.toFixed(1)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-[#E02424]" />
              Needs attention ({sourceLabel.toLowerCase()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {a.topUnsafe.length === 0 ? (
                <p className="text-sm text-[#6B7280]">Not enough data yet.</p>
              ) : (
                a.topUnsafe.map((area, i) => (
                  <div
                    key={area.area}
                    className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FEF2F2] text-xs font-bold text-[#991B1B]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">
                          {area.area}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {area.report_count} reports · {area.pct_safe}% safe
                        </p>
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                      style={{ background: LEVEL_COLORS[area.level] }}
                    >
                      {area.score.toFixed(1)} · {area.level}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {a.osmVsCommunity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              OSM infrastructure vs {sourceLabel.toLowerCase()} community score
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={a.osmVsCommunity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="area"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="osmScore"
                  name="OSM infrastructure"
                  stroke="#1A56DB"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="communityScore"
                  name={`${sourceLabel} community`}
                  stroke={sourceLabel === "Generated" ? "#7C3AED" : "#0E9F6E"}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Latest {sourceLabel.toLowerCase()} reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-[#6B7280]">No reports in this source.</p>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-[#111827]">
                      {r.area}{" "}
                      <span
                        className={
                          r.is_safe ? "text-[#0E9F6E]" : "text-[#E02424]"
                        }
                      >
                        · {r.is_safe ? "Safe" : "Unsafe"}
                      </span>
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          r.is_synthetic
                            ? "bg-[#F5F3FF] text-[#7C3AED]"
                            : "bg-[#ECFDF5] text-[#065F46]"
                        }`}
                      >
                        {r.is_synthetic ? "Generated" : "Real"}
                      </span>
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {r.time_of_day ?? "—"} ·{" "}
                      {new Date(r.created_at).toLocaleString()}
                      {r.comment ? ` · “${r.comment.slice(0, 60)}”` : ""}
                    </p>
                  </div>
                  {r.safety_rating != null && (
                    <span className="text-xs font-medium text-[#6B7280]">
                      {r.safety_rating}/5
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
