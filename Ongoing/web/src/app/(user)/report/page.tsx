import { ReportForm } from "@/components/report/ReportForm";

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-6 md:pb-10">
      <div className="mb-8 text-center sm:text-left">
        <p className="text-sm font-bold uppercase tracking-wide text-[#7C3AED]">
          SafeHer report
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-[#111827] sm:text-4xl">
          Share how this street feels
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[#6B7280] sm:mx-0">
          Three short steps. Location is automatic. Your answer stays anonymous
          and helps other women navigate Bengaluru safely.
        </p>
      </div>
      <ReportForm />
    </div>
  );
}
