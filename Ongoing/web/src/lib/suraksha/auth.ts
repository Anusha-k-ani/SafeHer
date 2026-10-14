import { createHmac, timingSafeEqual } from "crypto";
import { DEMO_USERS, homeFor, type Role } from "./domain";

export const SESSION_COOKIE = "suraksha_session";

export type Session = { id: string; name: string; role: Role; exp: number };

function secret(): string {
  return process.env.SURAKSHA_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim() || "suraksha-local-demo";
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function issueSession(user: { id: string; name: string; role: Role }): string {
  const payload: Session = { id: user.id, name: user.name, role: user.role, exp: Date.now() + 12 * 60 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function sessionFromCookie(value: string | undefined | null): Session | null {
  if (!value || !value.includes(".")) return null;
  const [body, mac] = value.split(".");
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const session = JSON.parse(Buffer.from(body, "base64url").toString()) as Session;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionFromRequest(request: Request): Session | null {
  const header = request.headers.get("cookie") || "";
  const part = header.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${SESSION_COOKIE}=`));
  if (!part) return null;
  return sessionFromCookie(decodeURIComponent(part.slice(SESSION_COOKIE.length + 1)));
}

export function authenticate(username: string, password: string) {
  const user = DEMO_USERS.find((u) => u.username === username.trim().toLowerCase());
  if (!user || user.password !== password) return null;
  return { id: user.id, name: user.name, role: user.role, home: homeFor(user.role) };
}

export function cookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${12 * 60 * 60}${secure}`;
}
