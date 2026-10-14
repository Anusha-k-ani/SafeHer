import { LightsBoard } from "@/components/suraksha/Workspaces";
import { requireRoles } from "@/lib/suraksha/guard";

export default async function Page() {
  const session = await requireRoles(["supervisor", "reviewer", "admin"], "/authority/lights");
  return <LightsBoard role={session.role as "supervisor" | "reviewer" | "admin"} />;
}
