import Link from "next/link";

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div>
        <p className="text-sm font-semibold text-teal-700">Safety Resources</p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-[#0B1D33]">Guidance you can trust</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#64748B]">
          Two pictures, two situations. A dim street is where incidents are reported. A lit street is the safer public space this project is trying to support.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="overflow-hidden rounded-3xl border border-[#D8E0E8] bg-white shadow-sm">
          <img
            src="/brand/scenes/incident-street.jpg"
            alt="Dim dusk street showing why harassment incidents are reported"
            className="h-56 w-full object-cover"
          />
          <div className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#B42318]">Incidents</p>
            <h2 className="text-xl font-bold text-[#0B1D33]">If a street feels unsafe</h2>
            <p className="text-sm leading-6 text-[#334155]">
              Use Report an Incident for a dated concern. Add GPS if you can. A street name is added only when OpenStreetMap can resolve it. Missing names stay as coordinates or district, never invented.
            </p>
            <Link href="/report/incident" className="inline-block rounded-xl bg-[#B42318] px-4 py-2 text-sm font-semibold text-white">
              Report an incident
            </Link>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-[#D8E0E8] bg-white shadow-sm">
          <img
            src="/brand/scenes/safe-street.jpg"
            alt="Well-lit evening street showing a safer public space"
            className="h-56 w-full object-cover"
          />
          <div className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Safety</p>
            <h2 className="text-xl font-bold text-[#0B1D33]">What safer streets look like</h2>
            <p className="text-sm leading-6 text-[#334155]">
              Working lights, open paths, and people who can be seen. Report a streetlight fault when a place should look like this and does not.
            </p>
            <Link href="/report/streetlight" className="inline-block rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
              Report a streetlight
            </Link>
          </div>
        </article>
      </div>

      <img
        src="/brand/scenes/help-resources.jpg"
        alt="Community help space for recording a concern"
        className="h-52 w-full rounded-3xl object-cover"
      />

      <section className="rounded-2xl border bg-white p-5 text-sm leading-6 text-[#334155]">
        <h2 className="font-semibold text-[#0B1D33]">If you are in immediate danger</h2>
        <p className="mt-2">Call 112. SurakshaSetu records in-app reports and Risk Alerts. It does not dispatch police, send SMS, or replace emergency services.</p>
      </section>
      <section className="rounded-2xl border bg-white p-5 text-sm leading-6 text-[#334155]">
        <h2 className="font-semibold text-[#0B1D33]">Risk Alert</h2>
        <p className="mt-2">Press once to arm. Press again within three seconds to send. Sign in as a citizen first. Location is attached only if the browser shares it.</p>
      </section>
      <section className="rounded-2xl border bg-white p-5 text-sm leading-6 text-[#334155]">
        <h2 className="font-semibold text-[#0B1D33]">Privacy</h2>
        <p className="mt-2">Other citizens cannot see your private reports. Public maps show aggregated analysis and labelled demonstration data, not another person’s exact SOS point.</p>
      </section>
    </main>
  );
}
