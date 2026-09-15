"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Search } from "lucide-react";
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
import { ScoreBadge } from "@/components/ui/badge";
import { FactorBreakdownChart } from "@/components/search/FactorBreakdownChart";
import {
  findStreetById,
  loadStreets,
  searchStreets,
  sortStreets,
} from "@/lib/data";
import { computeSafetyBreakdown } from "@/lib/scoring";
import type { Street } from "@/lib/types";

const StreetMiniMap = dynamic(
  () => import("./StreetMiniMap").then((m) => m.StreetMiniMap),
  { ssr: false }
);

type SortKey = "Safety_Score" | "Area" | "Police_Distance_m" | "Bus_Stop_Count";

export function SearchView() {
  const searchParams = useSearchParams();
  const initialStreet = searchParams.get("street") ?? "";

  const [streets, setStreets] = useState<Street[]>([]);
  const [query, setQuery] = useState(initialStreet ? "" : "");
  const [selected, setSelected] = useState<Street | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("Safety_Score");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreets()
      .then((data) => {
        setStreets(data);
        if (initialStreet) {
          const found = findStreetById(data, initialStreet);
          if (found) setSelected(found);
        }
      })
      .finally(() => setLoading(false));
  }, [initialStreet]);

  const results = useMemo(() => {
    const q = initialStreet && !query ? initialStreet : query;
    const filtered = searchStreets(streets, q, 200);
    return sortStreets(filtered, sortKey, sortDir);
  }, [streets, query, sortKey, sortDir, initialStreet]);

  const breakdown = selected ? computeSafetyBreakdown(selected) : null;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[#6B7280]">
        Loading street data…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Street Search</h1>
        <p className="mt-1 text-[#6B7280]">
          Search by street name, ID, or area across 46,424 records
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
        <Input
          className="pl-10"
          placeholder="e.g. MG Road, BLR_00001, Koramangala…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Results ({results.length}
              {results.length >= 200 ? "+" : ""})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[480px] overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Street</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("Area")}
                  >
                    Area {sortKey === "Area" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => toggleSort("Safety_Score")}
                  >
                    Score{" "}
                    {sortKey === "Safety_Score"
                      ? sortDir === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((s) => (
                  <TableRow
                    key={s.Street_ID}
                    className={
                      selected?.Street_ID === s.Street_ID
                        ? "bg-[#EBF2FF]"
                        : "cursor-pointer"
                    }
                    onClick={() => setSelected(s)}
                  >
                    <TableCell>
                      <p className="font-medium">{s.Street_Name}</p>
                      <p className="text-xs text-[#6B7280]">{s.Street_ID}</p>
                    </TableCell>
                    <TableCell>{s.Area}</TableCell>
                    <TableCell>
                      <ScoreBadge
                        score={s.Safety_Score}
                        level={s.Safety_Level}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selected && breakdown ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selected.Street_Name}</CardTitle>
                <p className="text-sm text-[#6B7280]">
                  {selected.Area} · {selected.Street_ID}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScoreBadge
                  score={selected.Safety_Score}
                  level={selected.Safety_Level}
                />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Bus stops (500m)" value={selected.Bus_Stop_Count} />
                  <Metric
                    label="Police distance"
                    value={`${selected.Police_Distance_m} m`}
                  />
                  <Metric
                    label="Hospital distance"
                    value={`${selected.Hospital_Distance_m} m`}
                  />
                  <Metric
                    label="CCTV"
                    value={selected.CCTV ? "Yes" : "No"}
                  />
                  <Metric label="Lighting score" value={selected.Lighting} />
                  <Metric label="Road condition" value={selected.Road_Condition} />
                </div>
                <StreetMiniMap street={selected} />
              </CardContent>
            </Card>
            <FactorBreakdownChart breakdown={breakdown} />
          </div>
        ) : (
          <Card>
            <CardContent className="flex min-h-[300px] items-center justify-center text-[#6B7280]">
              Select a street to view details and factor breakdown
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-[#F9FAFB] p-3">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className="font-semibold text-[#111827]">{value}</p>
    </div>
  );
}
