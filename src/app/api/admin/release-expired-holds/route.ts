import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredHolds } from "@/lib/db/queries/registrations";

/**
 * Vercel Cron Jobs always invoke via GET and, when `CRON_SECRET` is
 * configured, send `Authorization: Bearer <CRON_SECRET>` — not this app's own
 * `x-admin-secret` header. This route accepts either: the standard
 * `x-admin-secret` header (manual/dev triggering, matching every other admin
 * route) or a valid Vercel cron bearer token, so the same endpoint and logic
 * work both ways.
 */
function isAuthorized(request: NextRequest): boolean {
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret && adminSecret === process.env.ADMIN_SECRET) return true;

  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }
  return false;
}

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const released = await releaseExpiredHolds();
  return NextResponse.json({ released });
}

/** POST /api/admin/release-expired-holds — manual/dev trigger via `x-admin-secret`. */
export async function POST(request: NextRequest) {
  return handle(request);
}

/** GET /api/admin/release-expired-holds — Vercel Cron Jobs invoke via GET. */
export async function GET(request: NextRequest) {
  return handle(request);
}
