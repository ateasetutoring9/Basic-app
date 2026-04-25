import { NextResponse, type NextRequest } from "next/server";

// No Supabase Auth in v3 — auth is handled by the API layer.
// Middleware is a pass-through; add custom JWT/session logic here when ready.
export function middleware(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
