import { NextResponse } from "next/server";
import { cookieHeader, issueSession, sessionFromRequest, authenticate, type Session } from "./auth";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Request failed";
  const code = /not allowed|only a|cannot/i.test(message) ? 403 : status;
  return json({ ok: false, error: message }, code);
}

export function requireUser(request: Request): Session {
  const session = sessionFromRequest(request);
  if (!session) throw new Error("Sign in required");
  return session;
}

export function loginResponse(username: string, password: string) {
  const user = authenticate(username, password);
  if (!user) return json({ ok: false, error: "Unknown username or password." }, 401);
  const token = issueSession(user);
  const res = json({ ok: true, role: user.role, name: user.name, home: user.home });
  res.headers.set("Set-Cookie", cookieHeader(token));
  return res;
}
