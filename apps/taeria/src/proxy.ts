import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/common/adapters/supabase/middleware";

const REQUEST_ID_HEADER = "x-request-id";

export async function proxy(request: NextRequest) {
  const existingId = request.headers.get(REQUEST_ID_HEADER);
  const requestId = existingId ?? crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const supabaseResponse = await updateSupabaseSession(request);
  supabaseResponse.headers.set(REQUEST_ID_HEADER, requestId);

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
