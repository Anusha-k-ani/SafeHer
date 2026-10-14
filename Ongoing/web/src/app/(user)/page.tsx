import Link from "next/link";
import { Lightbulb, Map, Megaphone, ClipboardList } from "lucide-react";
import { SosHomeCard } from "@/components/suraksha/SosTap";

const ACTIONS = [
  { href: "/report/incident", title: "Report an Incident", body: "Choose a type and a place. A long description is optional.", icon: Megaphone },
  { href: "/report/streetlight", title: "Report a Streetlight Problem", body: "Tell the road where a light has failed.", icon: Lightbulb },
  { href: "/map", title: "Safety Map", body: "Aggregated Karnataka hotspot cells from the existing analysis. Exact new reports stay private.", icon: Map },
  { href: "/my-reports", title: "My Reports", body: "Reference numbers and the status of what you submitted.", icon: ClipboardList },
];

export default function UserHomePage() {
  return (
    <div className="pb-24 md:pb-8">
      <section className="border-b border-[#D8E0E8] bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <p className="text-sm font-semibold text-[#0F766E]">SurakshaSetu</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#17324D] sm:text-4xl">Connecting Streets. Protecting Lives.</h1>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            Incident Analysis and Hotspot Identification for Security Provision against Women Harassment in Public Spaces.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-3xl gap-3 px-4 py-6 sm:px-6">
        <SosHomeCard />
        {ACTIONS.map(({ href, title, body, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-start gap-4 rounded-2xl border border-[#D8E0E8] bg-white p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#17324D] text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span>
              <span className="block text-lg font-bold text-[#17324D]">{title}</span>
              <span className="mt-1 block text-sm text-[#64748B]">{body}</span>
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
