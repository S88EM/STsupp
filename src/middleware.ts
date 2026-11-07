import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("stsup_session")?.value;

  // Public paths that do not require authentication
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");

  const isPublicAssetOrApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/uploads") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/logo.png";

  if (isPublicAssetOrApi) {
    return NextResponse.next();
  }

  // If user is already authenticated and visits login/register, redirect to dashboard.
  // Note: /reset-password and /verify-email must NOT redirect to dashboard, even if a session cookie exists!
  const isAuthEntryPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  if (token && isAuthEntryPage) {
    const res = NextResponse.redirect(new URL("/", request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  // If user is NOT authenticated and tries to access protected pages or API routes
  if (!token && !isAuthPage) {
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json(
        { error: "Необхідно авторизуватися для доступу до API" },
        { status: 401 }
      );
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      return res;
    }

    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    const res = NextResponse.redirect(loginUrl);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
