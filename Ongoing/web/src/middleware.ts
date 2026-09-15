import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "safeher_admin";

function getSessionToken(): string | null {
  const explicit = process.env.ADMIN_SESSION_TOKEN?.trim();
  if (explicit) return explicit;
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) return null;
  return `session:${password}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionToken = getSessionToken();
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;

  // Login page is public; bounce already-authenticated users to dashboard
  if (pathname === "/admin") {
    if (sessionToken && cookie === sessionToken) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("error", "not_configured");
    return NextResponse.redirect(url);
  }

  if (cookie !== sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
