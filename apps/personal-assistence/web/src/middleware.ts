import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

const REQUEST_ID_HEADER = "x-request-id";

const { auth } = NextAuth(authConfig);

function withRequestId(
  req: Parameters<Parameters<typeof auth>[0]>[0],
  response: NextResponse,
): NextResponse {
  const existingId = req.headers.get(REQUEST_ID_HEADER);
  const requestId = existingId ?? crypto.randomUUID();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  if (response.status >= 300 && response.status < 400) {
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  const next = NextResponse.next({
    request: { headers: requestHeaders },
  });

  for (const [key, value] of response.headers.entries()) {
    next.headers.set(key, value);
  }

  next.headers.set(REQUEST_ID_HEADER, requestId);
  return next;
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtectedAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/contexts") ||
    pathname.startsWith("/finances");

  if (isProtectedAppRoute && !isLoggedIn) {
    return withRequestId(req, NextResponse.redirect(new URL("/auth", req.url)));
  }

  if (pathname === "/auth" && isLoggedIn) {
    return withRequestId(
      req,
      NextResponse.redirect(new URL("/dashboard", req.url)),
    );
  }

  return withRequestId(req, NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
