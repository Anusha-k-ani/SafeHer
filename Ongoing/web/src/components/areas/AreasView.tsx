"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadAreas } from "@/lib/data";
import { BRAND } from "@/lib/colors";
import type { AreaSummary } from "@/lib/types";

type SortKey = keyof AreaSummary;

export function AreasView() {
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("Avg_Safety_Score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAreas()
      .then(setAreas)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = areas.filter((a) => a.Area.toLowerCase().includes(q));
    list = [...list].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return 0;
    });
    return list;
  }, [areas, query, sortKey, sortDir]);

  const compareData = useMemo(
    () => areas.filter((a) => selected.includes(a.Area)),
    [areas, selected]
  );

  function toggleSelect(area: string) {
    setSelected((prev) => {
      if (prev.includes(area)) return prev.filter((a) => a !== area);
      if (prev.length >= 4) return prev;
      return [...prev, area];
    });
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#6B7280]">
        Loading area data…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Area Comparison</h1>
        <p className="mt-1 text-[#6B7280]">
          Compare safety across 53 BBMP areas — select up to 4 for side-by-side
          analysis
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-[#EBF2FF] bg-[#EBF2FF]/50 p-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-[#1A56DB]">
            Central commercial corridors
          </p>
          <p className="text-sm text-[#374151]">
            MG Road, Cubbon Park, Brigade Road, Church Street — highest
            infrastructure density and avg scores above 7.9
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#D97706]">
            Peri-urban fringe
          </p>
          <p className="text-sm text-[#374151]">
            Anekal, Attibele, Hoskote — sparse OSM mapping, fewer bus stops and
            emergency services within range
          </p>
        </div>
      </div>

      <Input
        placeholder="Filter areas…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {compareData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Areas Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="Area" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Safe" stackId="a" fill={BRAND.safe} />
                <Bar dataKey="Moderate" stackId="a" fill={BRAND.moderate} />
                <Bar dataKey="Unsafe" stackId="a" fill={BRAND.unsafe} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {compareData.map((a) => (
                <div
                  key={a.Area}
                  className="rounded-lg border border-[#E5E7EB] p-4"
                >
                  <p className="font-semibold text-[#111827]">{a.Area}</p>
                  <p className="text-2xl font-bold text-[#1A56DB]">
                    {a.Avg_Safety_Score.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {a.Street_Count} streets · {a.Safe} safe · {a.Unsafe}{" "}
                    unsafe
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Avg Score vs Street Count</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                dataKey="Street_Count"
                name="Streets"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="Avg_Safety_Score"
                name="Avg Score"
                domain={[3, 9]}
                tick={{ fontSize: 11 }}
              />
              <ZAxis range={[40, 400]} />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={areas} fill={BRAND.primary} />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Areas ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Select</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("Area")}
                >
                  Area
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("Street_Count")}
                >
                  Streets
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("Avg_Safety_Score")}
                >
                  Avg Score
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("Safe")}
                >
                  Safe
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("Moderate")}
                >
                  Moderate
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => toggleSort("Unsafe")}
                >
                  Unsafe
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.Area}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selected.includes(a.Area)}
                      onChange={() => toggleSelect(a.Area)}
                      disabled={
                        !selected.includes(a.Area) && selected.length >= 4
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{a.Area}</TableCell>
                  <TableCell>{a.Street_Count.toLocaleString()}</TableCell>
                  <TableCell>{a.Avg_Safety_Score.toFixed(2)}</TableCell>
                  <TableCell className="text-[#0E9F6E]">{a.Safe}</TableCell>
                  <TableCell className="text-[#D97706]">{a.Moderate}</TableCell>
                  <TableCell className="text-[#E02424]">{a.Unsafe}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
