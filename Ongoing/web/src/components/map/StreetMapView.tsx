"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filterMapPoints, loadMapPoints, loadStreets } from "@/lib/data";
import type { SafetyLevel, Street, StreetMapPoint } from "@/lib/types";
import { getUniqueAreas } from "@/lib/data";
import { loadReportsForMap } from "@/lib/reports";
import { loadAnalysisHotspots, type AnalysisHotspot } from "@/lib/analysis";
import { EMPTY_FILTERS, hotspotMatches, type AuthorityFilters } from "@/lib/authority-filters";
import { AuthorityFilterBar } from "@/components/dashboard/AuthorityFilterBar";
import type { CommunityMapPoint } from "./StreetMapInner";

const StreetMapInner = dynamic(
  () => import("./StreetMapInner").then((m) => m.StreetMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#F9FAFB] text-[#6B7280]">
        Loading map…
      </div>
    ),
  }
);

const LEVELS: SafetyLevel[] = ["Safe", "Moderate", "Unsafe"];

export function StreetMapView() {
  const [points, setPoints] = useState<StreetMapPoint[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [communityPoints, setCommunityPoints] = useState<CommunityMapPoint[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [scoreRange, setScoreRange] = useState<[number, number]>([3, 10]);
  const [cctvOnly, setCctvOnly] = useState(false);
  const [minBusStops, setMinBusStops] = useState(false);
  const [showInfrastructure, setShowInfrastructure] = useState(true);
  const [showCommunity, setShowCommunity] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [hotspots, setHotspots] = useState<AnalysisHotspot[]>([]);
  const [filters, setFilters] = useState<AuthorityFilters>(EMPTY_FILTERS);
  const [communitySource, setCommunitySource] = useState<
    "generated" | "real" | "both"
  >("generated");

  useEffect(() => {
    const tasks: Promise<unknown>[] = [
      loadMapPoints().then(setPoints),
      loadStreets().then((strs) => {
        setStreets(strs);
        setAreas(getUniqueAreas(strs));
      }),
      loadReportsForMap(2000)
        .then(setCommunityPoints)
        .catch(() => setCommunityPoints([])),
      loadAnalysisHotspots()
        .then(setHotspots)
        .catch(() => setHotspots([])),
    ];
    Promise.all(tasks).finally(() => setLoading(false));
  }, []);

  const streetLookup = useMemo(
    () => new Map(streets.map((s) => [s.Street_ID, s])),
    [streets]
  );

  const filtered = useMemo(() => {
    return filterMapPoints(
      points,
      {
        areas: filters.area !== "all" ? [filters.area] : undefined,
        levels: selectedLevel !== "all" ? [selectedLevel as SafetyLevel] : undefined,
        minScore: scoreRange[0],
        maxScore: scoreRange[1],
        cctvOnly,
        minBusStops: minBusStops ? 3 : undefined,
      },
      streetLookup
    );
  }, [
    points,
    filters.area,
    selectedLevel,
    scoreRange,
    cctvOnly,
    minBusStops,
    streetLookup,
  ]);

  const filteredCommunity = useMemo(() => {
    let list = communityPoints;
    if (communitySource === "generated") {
      list = list.filter((p) => p.is_synthetic);
    } else if (communitySource === "real") {
      list = list.filter((p) => !p.is_synthetic);
    }
    if (filters.area !== "all") list = list.filter((p) => p.area === filters.area);
    if (filters.timeOfDay !== "all") {
      list = list.filter((p) => p.time_of_day === filters.timeOfDay);
    }
    if (filters.incidentType !== "all") {
      list = list.filter((p) => {
        if (filters.incidentType === "harassment") {
          return p.incident_type === "harassment" || p.harassment_reported;
        }
        if (filters.incidentType === "unsafe_feeling") {
          return p.is_safe === false && p.incident_type == null;
        }
        return p.incident_type === filters.incidentType;
      });
    }
    if (filters.fromDate) {
      list = list.filter((p) => p.created_at.slice(0, 10) >= filters.fromDate);
    }
    if (filters.toDate) {
      list = list.filter((p) => p.created_at.slice(0, 10) <= filters.toDate);
    }
    return list;
  }, [communityPoints, filters, communitySource]);

  const filteredHotspots = useMemo(
    () => hotspots.filter((h) => hotspotMatches(h, filters)),
    [hotspots, filters]
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-[#6B7280]">
        Loading map data…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      <aside className="w-full shrink-0 overflow-y-auto border-b border-[#E5E7EB] bg-white p-4 lg:w-80 lg:border-b-0 lg:border-r">
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base">Map Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            <AuthorityFilterBar
              value={filters}
              onChange={setFilters}
              areas={areas}
            />
            <div className="space-y-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Layers
              </p>
              <label className="flex items-center gap-2 text-sm text-[#374151]">
                <input
                  type="checkbox"
                  checked={showInfrastructure}
                  onChange={(e) => setShowInfrastructure(e.target.checked)}
                  className="rounded border-[#D1D5DB]"
                />
                OSM infrastructure streets
              </label>
              <label className="flex items-center gap-2 text-sm text-[#374151]">
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={(e) => setShowHotspots(e.target.checked)}
                  className="rounded border-[#D1D5DB]"
                />
                Analysis hotspots ({hotspots.length})
              </label>
              <label className="flex items-center gap-2 text-sm text-[#374151]">
                <input
                  type="checkbox"
                  checked={showCommunity}
                  onChange={(e) => setShowCommunity(e.target.checked)}
                  className="rounded border-[#D1D5DB]"
                />
                Community reports ({filteredCommunity.length})
              </label>
              {showCommunity && (
                <div className="pl-6">
                  <label className="mb-1 block text-xs font-medium text-[#6B7280]">
                    Community source
                  </label>
                  <Select
                    value={communitySource}
                    onValueChange={(v) =>
                      setCommunitySource(v as "generated" | "real" | "both")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generated">Generated only</SelectItem>
                      <SelectItem value="real">Real users only</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">
                Safety Level (OSM)
              </label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6B7280]">
                Score range: {scoreRange[0].toFixed(1)} – {scoreRange[1].toFixed(1)}
              </label>
              <Slider
                min={3}
                max={10}
                step={0.1}
                value={scoreRange}
                onValueChange={(v) => setScoreRange(v as [number, number])}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                checked={cctvOnly}
                onChange={(e) => setCctvOnly(e.target.checked)}
                className="rounded border-[#D1D5DB]"
              />
              CCTV coverage only
            </label>

            <label className="flex items-center gap-2 text-sm text-[#374151]">
              <input
                type="checkbox"
                checked={minBusStops}
                onChange={(e) => setMinBusStops(e.target.checked)}
                className="rounded border-[#D1D5DB]"
              />
              3+ bus stops within 500m
            </label>

            <p className="text-sm text-[#6B7280]">
              Showing{" "}
              <strong className="text-[#111827]">
                {showInfrastructure ? filtered.length.toLocaleString() : 0}
              </strong>{" "}
              streets
              {showCommunity && (
                <>
                  {" "}
                  ·{" "}
                  <strong className="text-[#111827]">
                    {filteredCommunity.length}
                  </strong>{" "}
                  community reports
                </>
              )}
            </p>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#0E9F6E]" /> Safe
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#D97706]" /> Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-[#E02424]" /> Unsafe
              </span>
            </div>
          </CardContent>
        </Card>
      </aside>

      <div className="relative min-h-[400px] flex-1">
        <StreetMapInner
          points={filtered}
          streetLookup={streetLookup}
          communityPoints={filteredCommunity}
          hotspots={filteredHotspots}
          showCommunity={showCommunity}
          showInfrastructure={showInfrastructure}
          showHotspots={showHotspots}
        />
      </div>
    </div>
  );
}
