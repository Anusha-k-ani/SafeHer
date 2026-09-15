import Link from "next/link";
import { Megaphone, Map, Phone, Shield } from "lucide-react";

export default function UserHomePage() {
  return (
    <div className="pb-24 md:pb-0">
      <section className="relative overflow-hidden border-b border-[#EDE9FE] bg-gradient-to-b from-[#F5F3FF] to-[#F9FAFB]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
            SafeHer
          </p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-5xl">
            Walk Bengaluru with community safety insight
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#6B7280]">
            Report how a street feels, see live community signals on the map, or
            reach helplines fast — anonymous by default.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/report"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-6 text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              <Megaphone className="h-4 w-4" /> Report now
            </Link>
            <Link
              href="/map"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#DDD6FE] bg-white px-6 text-sm font-semibold text-[#7C3AED]"
            >
              <Map className="h-4 w-4" /> Open safety map
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6">
        {[
          {
            href: "/report",
            icon: Megaphone,
            title: "Report",
            body: "Feel safe, feel unsafe, or report an incident with GPS area matching.",
          },
          {
            href: "/map",
            icon: Map,
            title: "Map",
            body: "See community reports and street context across Bengaluru.",
          },
          {
            href: "/emergency",
            icon: Phone,
            title: "SOS",
            body: "Helplines, share live location, and trusted contact alerts.",
          },
        ].map(({ href, icon: Icon, title, body }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:border-[#DDD6FE] hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-extrabold text-[#111827]">
              {title}
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">{body}</p>
          </Link>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 text-center sm:px-6">
        <div className="rounded-2xl border border-[#EDE9FE] bg-white p-6">
          <Shield className="mx-auto h-8 w-8 text-[#7C3AED]" />
          <h2 className="mt-3 text-xl font-extrabold text-[#111827]">
            Peek at community safety
          </h2>
          <p className="mt-2 text-sm text-[#6B7280]">
            Quick glance at how others have rated areas — no login needed.
          </p>
          <Link
            href="/community"
            className="mt-4 inline-flex text-sm font-semibold text-[#7C3AED] hover:underline"
          >
            View safety overview →
          </Link>
        </div>
      </section>
    </div>
  );
}
