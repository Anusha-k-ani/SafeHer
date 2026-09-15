"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { safetyLevelColor } from "@/lib/colors";
import type { Street } from "@/lib/types";

export function StreetMiniMap({ street }: { street: Street }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(containerRef.current, {
      center: [street.Latitude, street.Longitude],
      zoom: 16,
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const color = safetyLevelColor(street.Safety_Level);
    L.circleMarker([street.Latitude, street.Longitude], {
      radius: 10,
      fillColor: color,
      color: "#fff",
      weight: 2,
      fillOpacity: 0.9,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [street]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full rounded-lg border border-[#E5E7EB]"
    />
  );
}
