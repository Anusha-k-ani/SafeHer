import { IncidentsBoard } from "@/components/suraksha/Workspaces";
import { requireRoles } from "@/lib/suraksha/guard";
export default async function Page() {
  const session = await requireRoles(["supervisor", "reviewer", "admin"], "/authority/incidents");
  return <IncidentsBoard role={session.role as "reviewer"} />;
}
