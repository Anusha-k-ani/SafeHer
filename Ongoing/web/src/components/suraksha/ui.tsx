export function Pill({ children, tone }: { children: React.ReactNode; tone: "red" | "amber" | "blue" | "green" | "grey" }) {
  const styles = {
    red: "bg-[#FEF2F2] text-[#B42318] border-[#FECACA]",
    amber: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    blue: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    green: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
    grey: "bg-[#F8FAFC] text-[#64748B] border-[#D8E0E8]",
  };
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[tone]}`}>{children}</span>;
}

export function toneFor(status: string): "red" | "amber" | "blue" | "green" | "grey" {
  if (["created", "notification_attempted", "location_unavailable", "escalated", "reported"].includes(status)) return "red";
  if (["under_review", "forwarded", "notified", "unavailable", "notification_failed"].includes(status)) return "amber";
  if (["unit_assigned", "responding", "arrived", "accepted", "work_assigned", "repair_in_progress", "acknowledged"].includes(status)) return "blue";
  if (["resolved", "completed", "verified", "verified_closed", "repair_completed"].includes(status)) return "green";
  return "grey";
}

export function label(status: string) {
  return status.replaceAll("_", " ");
}
