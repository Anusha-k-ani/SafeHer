import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  getAdminSessionToken,
  passwordsMatch,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  const sessionToken = getAdminSessionToken();
  if (!sessionToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Admin password is not configured. Add ADMIN_PASSWORD to web/.env.local and restart the server.",
      },
      { status: 503 }
    );
  }

  let body: { password?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!passwordsMatch(body.password)) {
    return NextResponse.json(
      { ok: false, error: "Incorrect password. Use the ADMIN_PASSWORD from web/.env.local." },
      { status: 401 }
    );
  }

  const nextPath =
    typeof body.next === "string" && body.next.startsWith("/admin/")
      ? body.next
      : "/admin/dashboard";

  const res = NextResponse.json({ ok: true, next: nextPath });
  res.cookies.set(ADMIN_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
