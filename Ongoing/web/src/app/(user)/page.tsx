import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionFromCookie } from "@/lib/suraksha/auth";
import { homeFor } from "@/lib/suraksha/domain";
import { LandingPage } from "@/components/suraksha/LandingPage";
import { CitizenHome } from "@/components/suraksha/CitizenHome";

export default async function HomePage() {
  const jar = await cookies();
  const session = sessionFromCookie(jar.get(SESSION_COOKIE)?.value);
  if (session && session.role !== "public") redirect(homeFor(session.role));
  if (session) {
    return <CitizenHome user={{ id: session.id, name: session.name, role: session.role, username: session.username || session.name }} />;
  }
  return <LandingPage />;
}
