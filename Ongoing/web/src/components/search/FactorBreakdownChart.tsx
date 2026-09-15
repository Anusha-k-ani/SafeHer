"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAND } from "@/lib/colors";
import type { SafetyBreakdown } from "@/lib/types";

export function FactorBreakdownChart({
  breakdown,
}: {
  breakdown: SafetyBreakdown;
}) {
  const data = breakdown.factors.map((f) => ({
    name: f.name.replace(" Distance", "").replace(" Count", ""),
    subScore: f.subScore,
    weighted: f.weighted,
    weightPct: `${Math.round(f.weight * 100)}%`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Factor Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 10 }}
              width={85}
            />
            <Tooltip
              formatter={(value, name) => {
                const n = Number(value ?? 0);
                return [
                  n.toFixed(2),
                  name === "subScore" ? "Sub-score" : "Weighted",
                ];
              }}
            />
            <Bar dataKey="subScore" fill={BRAND.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {breakdown.factors.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-[#374151]">
                {f.name}{" "}
                <span className="text-[#6B7280]">
                  ({Math.round(f.weight * 100)}%)
                </span>
              </span>
              <span className="font-medium text-[#111827]">
                {f.subScore} → {f.weighted.toFixed(2)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 font-semibold">
            <span>Total Safety Score</span>
            <span className="text-[#1A56DB]">{breakdown.total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
