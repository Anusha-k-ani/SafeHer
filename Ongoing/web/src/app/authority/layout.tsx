import { requireRoles } from "@/lib/suraksha/guard";
import { RoleNav } from "@/components/suraksha/Workspaces";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await requireRoles(["supervisor", "reviewer", "admin"], "/authority");
  return (
    <div className="min-h-full bg-[#F5F7FA]">
      <RoleNav role={session.role as "supervisor" | "reviewer" | "admin"} />
      {children}
    </div>
  );
}
