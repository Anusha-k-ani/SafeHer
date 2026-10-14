import { LightsBoard, RoleNav } from "@/components/suraksha/Workspaces";
import { requireRoles } from "@/lib/suraksha/guard";
export default async function Page() {
  const session = await requireRoles(["municipal", "admin"], "/municipal");
  return (
    <div>
      <RoleNav role={session.role as "municipal"} />
      <LightsBoard role={session.role as "municipal"} />
    </div>
  );
}
