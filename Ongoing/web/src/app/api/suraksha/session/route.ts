import { cookieHeader, sessionFromRequest, SESSION_COOKIE } from "@/lib/suraksha/auth";
import { fail, json, loginResponse } from "@/lib/suraksha/http";

export async function GET(request: Request) {
  const session = sessionFromRequest(request);
  if (!session) return json({ ok: false, user: null }, 401);
  return json({ ok: true, user: { id: session.id, name: session.name, role: session.role } });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string; password?: string };
    return loginResponse(body.username || "", body.password || "");
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE() {
  const res = json({ ok: true });
  res.headers.set("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
  return res;
}
