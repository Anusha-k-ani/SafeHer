import { requireRoles } from "@/lib/suraksha/guard";

export default async function SettingsPage() {
  await requireRoles(["supervisor", "reviewer", "admin"], "/authority/settings");
  return (
    <main className="space-y-4 p-4">
      <h1 className="text-2xl font-bold text-[#17324D]">Settings</h1>
      <p className="text-sm text-[#64748B]">
        Analysis thresholds are documented in Module 1. Changing them here is not enabled, so a demonstration cannot silently rewrite scores.
      </p>
      <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm text-[#1F2937] space-y-2">
        <h2 className="font-semibold text-[#17324D]">Current documented defaults</h2>
        <ul className="list-disc pl-5 text-[#64748B] space-y-1">
          <li>Hotspot grid: about 0.01° (~1 km).</li>
          <li>Minimum reports in a cell: 3.</li>
          <li>High risk: count ≥ 8, or count ≥ 5 with harassment share ≥ 40%.</li>
          <li>Medium risk: count ≥ 4.</li>
          <li>Only verified operational reports plus labelled demo rows enter clustering.</li>
          <li>KSP district totals are context only. They are not street coordinates.</li>
          <li>District of a point uses Karnataka polygons when the GeoJSON is present.</li>
          <li>Emerging: ≥3 approved points in the last 14 days and fewer than 3 in the 14 days before that.</li>
          <li>Persistent: minimum met in both windows and recent count at least 70% of prior.</li>
          <li>Declining observed: prior window met the minimum and recent count is under half. Not “safer”.</li>
          <li>Incident concern, environmental OSM concern, and patrol priority stay separate. Patrol priority is not computed.</li>
        </ul>
      </section>
      <section className="rounded-2xl border border-[#D8E0E8] bg-white p-4 text-sm text-[#64748B]">
        <h2 className="font-semibold text-[#17324D]">Accounts</h2>
        <p className="mt-2">This build uses local demonstration accounts. They are not operational police credentials. Password hashing and public registration are not implemented.</p>
      </section>
    </main>
  );
}
