import { AlertsBoard } from "@/components/suraksha/Workspaces";
import { requireRoles } from "@/lib/suraksha/guard";
export default async function Page() {
  const session = await requireRoles(["supervisor", "reviewer", "admin"], "/authority/alerts");
  return <AlertsBoard role={session.role as "supervisor"} />;
}
