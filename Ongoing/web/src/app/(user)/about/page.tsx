export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-sm leading-6 text-[#1F2937]">
      <p className="font-semibold text-teal-700">About / Credits</p>
      <h1 className="text-3xl font-bold text-[#0B1D33]">SurakshaSetu</h1>
      <p className="text-lg text-[#64748B]">Safe Spaces. Stronger Communities.</p>
      <img src="/brand/characters/empowered-citizen.jpg" alt="Original SurakshaSetu citizen illustration" className="max-h-80 w-full rounded-3xl object-cover object-top" />
      <p>A smarter way to report concerns, understand safety patterns and help communities build safer public spaces.</p>
      <p>
        Academic title, kept in documentation: Incident Analysis and Hotspot Identification for Security Provision against Women Harassment in Public Spaces.
      </p>
      <p>
        BMS Institute of Technology &amp; Management, Department of MCA. Guide: Dr. M. Sridevi.
        Contributors: Anusha K (Module 1 — geospatial analysis) and Aman Yadav (Module 2 — citizen and authority application).
      </p>
      <p>
        This application is a decision-support and reporting tool. It does not replace 112, a police control room, or professional judgement.
        Risk Alerts in this demo are recorded in-app only.
      </p>
      <p>
        Character illustrations are original project artwork, not existing copyrighted anime characters.
        Map tiles © OpenStreetMap contributors (ODbL). Street scores are an OSM infrastructure proxy, not a crime rate.
      </p>
    </main>
  );
}
