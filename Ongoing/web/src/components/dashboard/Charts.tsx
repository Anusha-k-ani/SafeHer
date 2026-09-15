"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/colors";
import type { AreaSummary, SummaryData } from "@/lib/types";
import { pct } from "@/lib/data";

const LEVEL_COLORS = {
  Safe: BRAND.safe,
  Moderate: BRAND.moderate,
  Unsafe: BRAND.unsafe,
};

export function SafetyLevelChart({ summary }: { summary: SummaryData }) {
  const data = [
    { name: "Safe", value: summary.safe, color: BRAND.safe },
    { name: "Moderate", value: summary.moderate, color: BRAND.moderate },
    { name: "Unsafe", value: summary.unsafe, color: BRAND.unsafe },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety Level Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const n = Number(value ?? 0);
                return [
                  `${n.toLocaleString()} (${pct(n, summary.totalStreets)})`,
                  "",
                ];
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ScoreHistogram({ summary }: { summary: SummaryData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={summary.scoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="range" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => Number(v ?? 0).toLocaleString()} />
            <Bar dataKey="count" fill={BRAND.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function TopAreasChart({ areas }: { areas: AreaSummary[] }) {
  const top = [...areas]
    .sort((a, b) => b.Avg_Safety_Score - a.Avg_Safety_Score)
    .slice(0, 10);
  const bottom = [...areas]
    .sort((a, b) => a.Avg_Safety_Score - b.Avg_Safety_Score)
    .slice(0, 10)
    .reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Safest Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={top} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="Area"
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip />
              <Bar dataKey="Avg_Safety_Score" fill={BRAND.safe} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Least Safe Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={bottom} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="Area"
                tick={{ fontSize: 11 }}
                width={75}
              />
              <Tooltip />
              <Bar dataKey="Avg_Safety_Score" fill={BRAND.unsafe} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function FactorAveragesChart({ summary }: { summary: SummaryData }) {
  const data = [
    { name: "Lighting", value: summary.factorAverages.lighting },
    { name: "Crowd", value: summary.factorAverages.crowd },
    { name: "Commercial", value: summary.factorAverages.commercial },
    { name: "Night", value: summary.factorAverages.night },
    { name: "Road", value: summary.factorAverages.road },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Average Factor Scores (City-wide)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill={BRAND.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function QuickActions() {
  const links = [
    { href: "/admin/hotspots", label: "Hotspots & alerts", desc: "Incident clusters + patrol list" },
    { href: "/admin/map", label: "Explore Map", desc: "Streets, reports, hotspot cells" },
    { href: "/admin/areas", label: "Compare Areas", desc: "53 BBMP zones ranked" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="font-semibold text-[#1A56DB]">{link.label}</p>
          <p className="mt-1 text-sm text-[#6B7280]">{link.desc}</p>
        </a>
      ))}
    </div>
  );
}

export { LEVEL_COLORS };
