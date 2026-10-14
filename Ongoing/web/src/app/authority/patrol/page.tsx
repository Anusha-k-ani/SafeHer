import { PatrolCommand } from "@/components/suraksha/Workspaces";
import { requireRoles } from "@/lib/suraksha/guard";
export default async function Page() {
  const session = await requireRoles(["supervisor", "admin"], "/authority/patrol");
  return <PatrolCommand role={session.role as "supervisor"} />;
}
