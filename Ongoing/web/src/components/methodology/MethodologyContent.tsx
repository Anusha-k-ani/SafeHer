import { SCORING_WEIGHTS } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import fs from "fs";
import path from "path";

function loadGeneratedOn(): string {
  try {
    const p = path.join(process.cwd(), "public/data/summary.json");
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    return data.generatedOn ?? "Unknown";
  } catch {
    return "Unknown";
  }
}

export function MethodologyContent() {
  const generatedOn = loadGeneratedOn();

  const pipeline = [
    "Define the 53 BBMP areas and their geographic bounding boxes.",
    "For each area, query Overpass API for all road segments (streets).",
    "Query Overpass API for nearby infrastructure: bus stops, police, hospitals, CCTV, street lamps.",
    "For each street, compute Haversine distance to nearest police station and hospital.",
    "Count bus stops within 500 m of each street centroid.",
    "Derive lighting, road condition, crowd level, and other attributes from OSM tags.",
    "Apply weighted safety scoring to produce Safety Score (0–10) and Safety Level.",
  ];

  const infrastructure = [
    ["Bus Stops", "highway=bus_stop, public_transport=stop_position", "BMTC and metro feeder stops in OSM"],
    ["Police Stations", "amenity=police", "Police stations and outposts"],
    ["Hospitals & Clinics", "amenity=hospital/clinic/doctors", "Government and private healthcare"],
    ["CCTV Cameras", "man_made=surveillance", "Surveillance cameras on poles and buildings"],
    ["Street Lamps", "highway=street_lamp", "Individual lamp posts mapped in OSM"],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">Methodology</h1>
        <p className="mt-1 text-[#6B7280]">
          How real Bengaluru street safety data was generated from OpenStreetMap
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">
          Dataset generated: {generatedOn}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why Real Data Matters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[#374151]">
          <p>
            Every row in this dataset corresponds to an actual road segment in
            OpenStreetMap. Bus-stop counts, distances to police and hospitals,
            CCTV presence, and lighting scores are computed from real OSM nodes
            — not estimated or randomly generated.
          </p>
          <p>
            AI wrote the Python pipeline; OpenStreetMap provided the geographic
            data. This distinction ensures the dataset has genuine utility for
            urban safety research and policy analysis.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7-Step Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-[#374151]">
            {pipeline.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Categories</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>OSM Tag</TableHead>
                <TableHead>What It Captures</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {infrastructure.map(([cat, tag, desc]) => (
                <TableRow key={cat}>
                  <TableCell className="font-medium">{cat}</TableCell>
                  <TableCell className="text-[#1A56DB]">{tag}</TableCell>
                  <TableCell>{desc}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Scoring Weights</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factor</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>How Sub-Score Is Computed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SCORING_WEIGHTS.map((row) => (
                <TableRow key={row.factor}>
                  <TableCell className="font-medium">{row.factor}</TableCell>
                  <TableCell className="text-[#1A56DB]">{row.weight}</TableCell>
                  <TableCell>{row.how}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="p-4 text-sm text-[#6B7280]">
            Final score ≥ 7.0 = Safe · 4.0–6.99 = Moderate · &lt; 4.0 = Unsafe
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-[#0E9F6E]/30 bg-[#F0FDF4]">
          <CardHeader>
            <CardTitle className="text-[#0E9F6E]">What IS Real</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[#374151]">
              <li>Street names and GPS coordinates from OSM road ways</li>
              <li>Bus stop counts from real OSM nodes within 500m</li>
              <li>Police/hospital distances to actual OSM facilities</li>
              <li>CCTV from real surveillance nodes within 300m</li>
              <li>Lighting from OSM lit tags and street lamp nodes</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-[#D97706]/30 bg-[#FFFBEB]">
          <CardHeader>
            <CardTitle className="text-[#D97706]">
              What Is Inferred
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-[#374151]">
              <li>Crowd level inferred from highway type, not footfall</li>
              <li>Night activity estimated from road type + crowd score</li>
              <li>OSM completeness varies in outer areas</li>
              <li>Distances are Haversine (straight-line), not road travel</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reproducibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-[#374151]">
          <p>
            Run <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5 text-sm">create_bengaluru_dataset.py</code>{" "}
            with Python 3, requests, pandas, and openpyxl. No API keys required
            — the public Overpass API is free. Full regeneration takes
            approximately 45–60 minutes.
          </p>
          <p className="text-sm text-[#6B7280]">
            Future enhancements: live OSM refresh, route-based distances, crime
            data overlay, user accounts, ML predictions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
