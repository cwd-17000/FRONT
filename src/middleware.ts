// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("access_token");
  const isAuth = !!token;
  const { pathname } = req.nextUrl;

  // Redirect unauthenticated users away from protected pages
  if (!isAuth) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Redirect already-authenticated users away from auth pages
  if (isAuth) {
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

// src/middleware.ts
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/register",
  ],
};

