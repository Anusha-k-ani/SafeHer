import { RiskAlertButton } from "@/components/suraksha/RiskAlertButton";
import Link from "next/link";

export default function SosPage() {
  return (
    <div className="bg-[#0B1D33] px-4 py-10 text-white">
      <div className="mx-auto max-w-xl space-y-5">
        <h1 className="text-3xl font-bold">Risk Alert</h1>
        <p className="text-sm text-white/70">
          Press once to arm. Press again within three seconds to send. Sign in as a citizen first.
          If you are in immediate danger, call 112. This records an in-app alert. It does not contact a live police control room.
        </p>
        <RiskAlertButton />
        <a href="tel:112" className="flex h-12 items-center justify-center rounded-xl border border-white/20 font-semibold">Call 112</a>
        <Link href="/my-reports" className="inline-block text-sm font-semibold text-teal-300">My reports</Link>
      </div>
    </div>
  );
}
