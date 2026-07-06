/**
 * Local development substitute for the Vercel cron configured in vercel.json.
 * Hits POST /api/admin/release-expired-holds on an interval so expired holds
 * get released while running `npm run dev` without needing a real Vercel
 * deployment. Run alongside `npm run dev` in a second terminal via
 * `npm run dev:cron`.
 */
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const INTERVAL_MS = Number(process.env.DEV_CRON_INTERVAL_MS ?? 5 * 60 * 1000);

async function releaseExpiredHolds(): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/api/admin/release-expired-holds`, {
      method: "POST",
      headers: { "x-admin-secret": ADMIN_SECRET ?? "" },
    });
    const body = await response.json();
    console.log(`[dev-hold-cron] ${new Date().toISOString()} ->`, response.status, body);
  } catch (err) {
    console.error("[dev-hold-cron] request failed", err);
  }
}

console.log(`[dev-hold-cron] polling ${BASE_URL} every ${INTERVAL_MS}ms`);
releaseExpiredHolds();
setInterval(releaseExpiredHolds, INTERVAL_MS);
