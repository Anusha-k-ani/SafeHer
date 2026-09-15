"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { safetyLevelColor } from "@/lib/colors";
import type { Street, StreetMapPoint } from "@/lib/types";
import type { AnalysisHotspot } from "@/lib/analysis";
import { RISK_COLOR } from "@/lib/analysis";

export interface CommunityMapPoint {
  id: string;
  lat: number;
  lon: number;
  area: string;
  is_safe: boolean;
  safety_rating: number | null;
  created_at: string;
  is_synthetic?: boolean;
  incident_type?: string | null;
  time_of_day?: string | null;
  harassment_reported?: boolean | null;
}

interface Props {
  points: StreetMapPoint[];
  streetLookup: Map<string, Street>;
  communityPoints?: CommunityMapPoint[];
  hotspots?: AnalysisHotspot[];
  showCommunity?: boolean;
  showInfrastructure?: boolean;
  showHotspots?: boolean;
}

export function StreetMapInner({
  points,
  streetLookup,
  communityPoints = [],
  hotspots = [],
  showCommunity = false,
  showInfrastructure = true,
  showHotspots = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.FeatureGroup | null>(null);
  const communityLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [12.97, 77.59],
      zoom: 11,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 100,
      maxClusterRadius: 50,
    });

    const communityLayer = L.layerGroup();
    const hotspotLayer = L.layerGroup();

    map.addLayer(cluster);
    map.addLayer(hotspotLayer);
    map.addLayer(communityLayer);
    mapRef.current = map;
    clusterRef.current = cluster;
    communityLayerRef.current = communityLayer;
    hotspotLayerRef.current = hotspotLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
      communityLayerRef.current = null;
      hotspotLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();
    if (!showInfrastructure) return;

    for (const p of points) {
      const color = safetyLevelColor(p.level);
      const marker = L.circleMarker([p.lat, p.lon], {
        radius: 5,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.75,
      });

      const street = streetLookup.get(p.id);
      const popupHtml = `
        <div style="min-width:180px;font-family:Arial,sans-serif">
          <strong>${escapeHtml(p.name)}</strong><br/>
          <span style="color:#6B7280;font-size:12px">${escapeHtml(p.area)}</span><br/>
          <span style="font-weight:600;color:${color}">${p.score.toFixed(2)} · ${p.level}</span>
          ${street ? `<br/><span style="font-size:12px">Bus stops: ${street.Bus_Stop_Count} · CCTV: ${street.CCTV ? "Yes" : "No"}</span>` : ""}
          <br/><a href="/admin/search?street=${encodeURIComponent(p.id)}" style="color:#1A56DB;font-size:12px">View details →</a>
        </div>
      `;
      marker.bindPopup(popupHtml);
      cluster.addLayer(marker);
    }
  }, [points, streetLookup, showInfrastructure]);

  useEffect(() => {
    const layer = communityLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showCommunity) return;

    for (const r of communityPoints) {
      const color = r.is_safe ? "#0E9F6E" : "#E02424";
      const marker = L.circleMarker([r.lat, r.lon], {
        radius: 8,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      });
      marker.bindPopup(`
        <div style="min-width:160px;font-family:Arial,sans-serif">
          <strong>${r.is_safe ? "Safe" : "Unsafe"}</strong>
          ${r.is_synthetic ? ' <span style="font-size:10px;color:#7C3AED;font-weight:700">SYNTHETIC</span>' : ' <span style="font-size:10px;color:#065F46;font-weight:700">LIVE</span>'}<br/>
          <span style="color:#6B7280;font-size:12px">${escapeHtml(r.area)}</span><br/>
          ${r.safety_rating != null ? `<span style="font-size:12px">Rating: ${r.safety_rating}/5</span><br/>` : ""}
          <span style="font-size:11px;color:#9CA3AF">${new Date(r.created_at).toLocaleString()}</span>
        </div>
      `);
      layer.addLayer(marker);
    }
  }, [communityPoints, showCommunity]);

  useEffect(() => {
    const layer = hotspotLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showHotspots) return;

    for (const h of hotspots) {
      const color = RISK_COLOR[h.risk_level];
      const marker = L.circle([h.latitude, h.longitude], {
        radius: 280 + h.report_count * 40,
        color,
        weight: 2,
        fillColor: color,
        fillOpacity: 0.22,
      });
      marker.bindPopup(`
        <div style="min-width:180px;font-family:Arial,sans-serif">
          <strong>Hotspot · ${escapeHtml(h.risk_level)}</strong><br/>
          <span style="color:#6B7280;font-size:12px">${escapeHtml(h.area)}</span><br/>
          <span style="font-size:12px">${h.report_count} reports · ${h.harassment_count} harassment</span><br/>
          <span style="font-size:11px;color:#9CA3AF">Peak: ${escapeHtml(h.peak_time_of_day)}</span>
        </div>
      `);
      layer.addLayer(marker);
    }
  }, [hotspots, showHotspots]);

  return <div ref={containerRef} className="h-full w-full" />;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
