import { PatrolMobile, RoleNav } from "@/components/suraksha/Workspaces";
import { requireRoles } from "@/lib/suraksha/guard";
export default async function Page() {
  const session = await requireRoles(["patrol", "supervisor", "admin"], "/patrol");
  return (
    <div>
      <RoleNav role={session.role as "patrol"} />
      <PatrolMobile />
    </div>
  );
}
