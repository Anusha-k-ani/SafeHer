import { readFile } from "fs/promises";
import path from "path";
import { requireRoles } from "@/lib/suraksha/guard";

type DistrictRow = {
  district: string;
  streets: number;
  lamp_within_300m: number;
  lit_tag_filled: number;
  cctv_within_500m: number;
};

type Coverage = {
  generated_at?: string;
  base_dataset?: {
    streets: number;
    districts_with_streets: number;
    lamp_within_300m: number;
    lit_tag_filled: number;
    cctv_within_500m: number;
    note: string;
    by_district: DistrictRow[];
  };
  streetlights?: {
    rows: number;
    expected_query_count: number;
    import_complete: boolean;
    pages_done: number;
    by_authority: Record<string, number>;
    by_district: { district: string; poles: number }[];
    status_note: string;
    district_method: string;
    retrieved_at?: string;
  };
  cctv?: {
    cameras: number;
    sources: Record<string, number>;
    districts_without_records: string[];
    by_district: { district: string; cameras: number }[];
    note: string;
  };
  sources?: { name: string; url: string; provider: string; access: string; coverage: string }[];
};

async function loadCoverage(): Promise<Coverage | null> {
  try {
    const file = path.join(process.cwd(), "public/data/analysis/infrastructure_coverage.json");
    return JSON.parse(await readFile(file, "utf8")) as Coverage;
  } catch {
    return null;
  }
}

export default async function Page() {
  await requireRoles(["supervisor", "reviewer", "admin"], "/authority/coverage");
  const coverage = await loadCoverage();
  if (!coverage?.base_dataset || !coverage.cctv) {
    return <p className="p-4 text-sm text-[#64748B]">Coverage file is not ready. Run Module1_Analysis/import_infrastructure.py local.</p>;
  }
  const base = coverage.base_dataset;
  const lights = coverage.streetlights;
  const cctv = coverage.cctv;
  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold text-[#17324D]">Data coverage</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#64748B]">
          Counts are calculated from files in this project. A missing street light or camera is a gap in the inventory. It is not evidence that the street is dark or that no camera exists.
          Generated {coverage.generated_at || "from the last import"}.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
          <p className="text-sm text-[#64748B]">OSM streets scanned</p>
          <p className="mt-1 text-3xl font-bold text-[#17324D]">{base.streets.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm text-[#64748B]">{base.districts_with_streets} districts</p>
        </article>
        <article className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
          <p className="text-sm text-[#64748B]">KSRSAC poles with a light fitting</p>
          <p className="mt-1 text-3xl font-bold text-[#17324D]">{(lights?.rows || 0).toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm text-[#64748B]">
            {lights?.import_complete ? "Import finished" : `Import in progress, ${lights?.pages_done || 0} pages saved`}
            {lights?.expected_query_count ? ` of about ${lights.expected_query_count.toLocaleString("en-IN")} query rows` : ""}
          </p>
        </article>
        <article className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
          <p className="text-sm text-[#64748B]">Camera positions on file</p>
          <p className="mt-1 text-3xl font-bold text-[#17324D]">{cctv.cameras.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-sm text-[#64748B]">{cctv.districts_without_records.length} districts have no camera row</p>
        </article>
      </div>
      <p className="max-w-3xl text-sm text-[#1F2937]">{base.note}</p>
      <p className="max-w-3xl text-sm text-[#1F2937]">
        Mapped lamps within 300 m: {base.lamp_within_300m.toLocaleString("en-IN")}. Streets with an OSM lit tag: {base.lit_tag_filled.toLocaleString("en-IN")}. Streets with a mapped camera within 500 m: {base.cctv_within_500m.toLocaleString("en-IN")}.
      </p>
      <div className="overflow-x-auto rounded-2xl border border-[#D8E0E8] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#D8E0E8] text-[#64748B]">
            <tr>
              <th className="px-3 py-2 font-medium">District</th>
              <th className="px-3 py-2 font-medium">Streets</th>
              <th className="px-3 py-2 font-medium">Lamps within 300 m</th>
              <th className="px-3 py-2 font-medium">OSM lit tag</th>
              <th className="px-3 py-2 font-medium">Camera within 500 m</th>
            </tr>
          </thead>
          <tbody>
            {base.by_district.map((row) => (
              <tr key={row.district} className="border-b border-[#D8E0E8] last:border-0">
                <td className="px-3 py-2 text-[#1F2937]">{row.district}</td>
                <td className="px-3 py-2">{row.streets.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{row.lamp_within_300m.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{row.lit_tag_filled.toLocaleString("en-IN")}</td>
                <td className="px-3 py-2">{row.cctv_within_500m.toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-[#17324D]">Street-light import</h2>
        <p className="max-w-3xl text-sm text-[#1F2937]">{lights?.status_note}</p>
        <p className="max-w-3xl text-sm text-[#64748B]">{lights?.district_method}</p>
        {lights && Object.keys(lights.by_authority).length > 0 && (
          <ul className="flex flex-wrap gap-2 text-sm">
            {Object.entries(lights.by_authority).map(([name, count]) => (
              <li key={name} className="rounded-full border border-[#D8E0E8] bg-white px-3 py-1">{name}: {count.toLocaleString("en-IN")}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold text-[#17324D]">CCTV inventory</h2>
        <p className="max-w-3xl text-sm text-[#1F2937]">{cctv.note}</p>
        <p className="text-sm text-[#64748B]">Sources in the camera file: {Object.entries(cctv.sources).map(([name, count]) => `${name} ${count.toLocaleString("en-IN")}`).join(", ")}.</p>
        <p className="max-w-3xl text-sm text-[#1F2937]">No camera row: {cctv.districts_without_records.join(", ")}.</p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-[#17324D]">Sources checked</h2>
        <div className="grid gap-3">
          {(coverage.sources || []).map((source) => (
            <article key={source.url} className="rounded-2xl border border-[#D8E0E8] bg-white p-4">
              <h3 className="font-semibold text-[#17324D]">{source.name}</h3>
              <p className="text-sm text-[#64748B]">{source.provider}</p>
              <p className="mt-1 text-sm text-[#1F2937]">{source.access}</p>
              <p className="mt-1 text-sm text-[#1F2937]">{source.coverage}</p>
              <p className="mt-1 break-all text-sm text-[#0F766E]">{source.url}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
