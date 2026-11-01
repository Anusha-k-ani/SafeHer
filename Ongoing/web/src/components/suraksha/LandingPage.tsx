import Link from "next/link";

export function LandingPage() {
  return (
    <div className="landing-shell bg-[#071524] text-white">
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">SurakshaSetu — Safe Spaces. Stronger Communities.</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-6xl">Every Street Deserves to Feel Safe.</h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            A smarter way to report concerns, understand safety patterns and help communities build safer public spaces.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-[#062017]">Report Incident</Link>
            <Link href="/map" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold">Explore Safety Map</Link>
          </div>
        </div>
        <img src="/brand/characters/empowered-citizen.jpg" alt="Original illustration of a confident citizen standing for safer streets" className="w-full rounded-[2rem] object-cover shadow-2xl" />
      </section>

      <section className="border-y border-white/10 bg-[#0B1D33] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Risk Alert</h2>
          <p className="mt-3 max-w-3xl text-white/70">The red button stays at the bottom of every page. One press arms. A second press within three seconds records an in-app alert for the connected authority workspace. It does not contact 112 or a live control room.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold">How SurakshaSetu works</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Citizens report", "File an incident or streetlight concern. Your private reports stay on your account until a reviewer acts."],
            ["Authorities respond", "Supervisors and reviewers see pending reports and in-app SOS alerts. Patrol tasks stay demonstration records."],
            ["Intelligence stays honest", "Hotspots use the published ~1 km grid. Demo rows are labelled. A place with no reports is not called safe."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-white/70">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-2">
        <img src="/brand/characters/community-ally.jpg" alt="Original illustration of a community ally" className="rounded-[2rem] object-cover" />
        <div>
          <h2 className="text-3xl font-bold">For citizens and authorities</h2>
          <p className="mt-3 text-white/70">Citizens get a simple home, reports, a safety map and resources. Authorities get a separate workspace for incidents, SOS, hotspots, temporal patterns and data quality. They do not share one dashboard with different labels.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0B1D33]">Citizen login</Link>
            <Link href="/login?kind=authority" className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold">Authority login</Link>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0B1D33] px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold">Privacy and transparency</h2>
            <p className="mt-3 text-white/70">Precise coordinates stay off public maps. Reverse geocoding uses OpenStreetMap Nominatim when coordinates exist and never invents a street name. Analysis still aggregates at district and grid level.</p>
            <Link href="/map" className="mt-6 inline-block text-sm font-semibold text-teal-300">Open the safety map</Link>
          </div>
          <img src="/brand/characters/safety-guardian.jpg" alt="Original illustration of a safety guardian" className="rounded-[2rem] object-cover" />
        </div>
      </section>
    </div>
  );
}
