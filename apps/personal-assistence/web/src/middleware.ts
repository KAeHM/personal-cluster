import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/contexts");

  if (isProtectedAppRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth", req.url));
  }

  if (pathname === "/auth" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/contexts", "/contexts/:path*", "/auth"],
};
