import type { AreaSafety, MapReport } from "./reports";
import { communityLevel, communityScore } from "./reports";
import { incidentLabel } from "./incidents";
import { AREAS } from "./areas";

type AreaCenter = AreaSafety & {
  lat: number;
  lon: number;
  score: number;
  level: "Safe" | "Moderate" | "Unsafe";
};

function areaCenters(areas: AreaSafety[]): AreaCenter[] {
  return areas
    .map((a) => {
      const bbox = AREAS[a.area];
      if (!bbox) return null;
      const [s, w, n, e] = bbox;
      const score = communityScore(Number(a.pct_safe), a.avg_rating);
      const level = communityLevel(score);
      return {
        ...a,
        lat: (s + n) / 2,
        lon: (w + e) / 2,
        score,
        level,
      };
    })
    .filter(Boolean) as AreaCenter[];
}

/** Leaflet + OSM HTML for WebView — no Google Maps API key required. */
export function buildMapHtml(opts: {
  reports: MapReport[];
  areas: AreaSafety[];
  filter: "all" | "safe" | "unsafe" | "incident";
  showAreas: boolean;
  myLoc: { lat: number; lon: number } | null;
}): string {
  const { filter, showAreas, myLoc } = opts;
  let reports = opts.reports;
  if (filter === "safe")
    reports = reports.filter((r) => r.is_safe && r.report_kind !== "incident");
  else if (filter === "unsafe")
    reports = reports.filter((r) => !r.is_safe && r.report_kind !== "incident");
  else if (filter === "incident")
    reports = reports.filter((r) => r.report_kind === "incident");

  const pins = reports.map((r) => {
    const isIncident = r.report_kind === "incident";
    const color = isIncident ? "#C2410C" : r.is_safe ? "#0E9F6E" : "#E02424";
    const label = isIncident
      ? `Incident · ${incidentLabel(r.incident_type)}`
      : r.is_safe
        ? "Safe"
        : "Unsafe";
    const rating =
      r.safety_rating != null ? ` · ${r.safety_rating}/5` : "";
    return {
      id: r.id,
      lat: r.lat,
      lon: r.lon,
      area: r.area,
      color,
      label: `${label}${rating}`,
      when: r.created_at,
      synth: !!r.is_synthetic,
    };
  });

  const areas = showAreas
    ? areaCenters(opts.areas).map((a) => ({
        lat: a.lat,
        lon: a.lon,
        area: a.area,
        level: a.level,
        score: a.score,
        color:
          a.level === "Safe"
            ? "#0E9F6E"
            : a.level === "Moderate"
              ? "#D97706"
              : "#E02424",
      }))
    : [];

  const center = myLoc
    ? { lat: myLoc.lat, lon: myLoc.lon, zoom: 14 }
    : { lat: 12.97, lon: 77.59, zoom: 11 };

  const payload = JSON.stringify({ pins, areas, center, myLoc }).replace(
    /</g,
    "\\u003c"
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#F3F4F6; }
    .pin {
      width:14px; height:14px; border-radius:50%;
      border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.35);
    }
    .me {
      width:16px; height:16px; border-radius:50%;
      background:#2563EB; border:3px solid #fff;
      box-shadow:0 0 0 6px rgba(37,99,235,.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var data = ${payload};
    var map = L.map('map', { zoomControl: true }).setView(
      [data.center.lat, data.center.lon], data.center.zoom
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    data.areas.forEach(function (a) {
      L.circle([a.lat, a.lon], {
        radius: 600,
        color: a.color,
        weight: 1,
        fillColor: a.color,
        fillOpacity: 0.18
      }).addTo(map).bindPopup(
        '<b>' + a.area + '</b><br/>' + a.level + ' · ' + a.score.toFixed(1) + '/10'
      );
    });

    data.pins.forEach(function (p) {
      var icon = L.divIcon({
        className: '',
        html: '<div class="pin" style="background:' + p.color + '"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
      L.marker([p.lat, p.lon], { icon: icon }).addTo(map).bindPopup(
        '<b>' + p.area + '</b><br/>' + p.label +
        '<br/><small>' + (p.synth ? 'Generated' : 'Live') + '</small>'
      );
    });

    if (data.myLoc) {
      var meIcon = L.divIcon({
        className: '',
        html: '<div class="me"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([data.myLoc.lat, data.myLoc.lon], { icon: meIcon })
        .addTo(map)
        .bindPopup('You are here');
    }

    window.SafeHerMap = {
      goMe: function () {
        if (!data.myLoc) return;
        map.setView([data.myLoc.lat, data.myLoc.lon], 15, { animate: true });
      },
      goBlr: function () {
        map.setView([12.97, 77.59], 11, { animate: true });
      }
    };
  </script>
</body>
</html>`;
}
