import { NextRequest, NextResponse } from "next/server";

/**
 * Guards an admin API route with the shared admin secret (Fase 1's only
 * access control — no user accounts, no NextAuth), accepted either as the
 * `x-admin-secret` header or a `?secret=` query param (per spec: "verificar
 * x-admin-secret header o query param ?secret="). Returns a 401
 * `NextResponse` when neither matches `ADMIN_SECRET`, or `null` when the
 * request is authorized and the handler should proceed.
 */
export function requireAdminSecret(request: NextRequest): NextResponse | null {
  const provided =
    request.headers.get("x-admin-secret") ?? request.nextUrl.searchParams.get("secret");
  if (!provided || provided !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
