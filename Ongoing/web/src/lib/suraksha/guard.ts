import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, sessionFromCookie, type Session } from "./auth";
import type { Role } from "./domain";

export async function requireRoles(roles: Role[], next: string): Promise<Session> {
  const jar = await cookies();
  const session = sessionFromCookie(jar.get(SESSION_COOKIE)?.value);
  if (!session || !roles.includes(session.role)) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}
