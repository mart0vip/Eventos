# Architecture

This document explains how the Club Hípico Argentino app is built and why, so future changes stay consistent with the existing design.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | File-based routing, fast dev server, no need for a custom build setup. |
| Language | TypeScript (strict) | Static types for the competition/registration/member shapes shared across API routes and pages. |
| UI | React 19 | Server Components for read-only pages where possible; interactive forms/tabs are `"use client"`. |
| Styling | Tailwind CSS v4 with a custom `@theme` | Club Hípico Argentino brand palette and typography (see `docs/MarcaCHA.md`) and reusable utility classes (`.btn-primary`, `.card-hover`, `.input-field`, etc.) defined once in `src/app/globals.css`. |
| Fonts | `next/font/google` (Montserrat + Open Sans) | Loaded once in `src/app/layout.tsx` as CSS variables (`--font-montserrat`, `--font-open-sans`); no external font requests at runtime. |
| Icons | lucide-react | Lightweight, tree-shakeable icon set. |
| Dates | date-fns (+ `date-fns/locale`) | Locale-aware formatting (`es`/`en`) and `parseISO` for correct date-only parsing (see [Pitfalls](#pitfalls-and-non-obvious-decisions)). |
| Data | PostgreSQL, raw `pg` driver (no ORM) | `src/lib/db/` — see [Database](#database-srclibdb). |
| Payments | Mercado Pago Checkout Pro | `src/lib/mercadopago.ts` + webhook at `src/app/api/webhooks/mercadopago/route.ts` — see [Mercado Pago integration](#mercado-pago-integration). |
| Email | Resend | `src/lib/email.ts` — confirmation/receipt emails sent from the webhook, never from the frontend. |
| Spreadsheets | ExcelJS | `src/lib/export.ts` — daily XLSX export for the club's legacy desktop system. |
| Auth | Shared secret (`ADMIN_SECRET`) | No user accounts. See [Known limitations](#known-limitations). |
| i18n | Custom React Context (`src/i18n/`) | No locale-routing requirement, so a full library (`next-intl`) would add routing/middleware complexity the app doesn't need. |

## Directory layout

```
src/
├── app/
│   ├── page.tsx                              → /                    (redirects to /concursos)
│   ├── concursos/page.tsx                    → /concursos           (public listing)
│   ├── concursos/[id]/page.tsx                → /concursos/:id       (detail + inscripción)
│   ├── inscripcion/gracias|error|pendiente/    → post-payment landing pages
│   ├── socios/[id]/page.tsx                   → /socios/:id          (member debt portal, public link)
│   ├── admin/page.tsx                         → /admin               (protected by ADMIN_SECRET)
│   ├── api/                                    # route handlers, see Routing & API below
│   ├── layout.tsx                             # root layout — fonts + LanguageProvider
│   └── globals.css                             # Tailwind theme tokens + custom utility classes
├── components/
│   ├── admin/                                  # the 7 tabs of the /admin panel
│   └── icons/                                  # SocialIcons (Facebook/Instagram)
├── i18n/                                       # translation dictionary + LanguageContext
├── lib/
│   ├── db/                                     # Postgres client, query functions, migrations, seed
│   ├── auth/admin-secret.ts                    # requireAdminSecret() route guard
│   ├── adminSecret.ts                          # client-side sessionStorage helper + adminFetch()
│   ├── validation/                             # zod schemas
│   ├── mercadopago.ts                          # checkout preferences + webhook signature verification
│   ├── email.ts                                # Resend confirmation/receipt emails
│   ├── export.ts                               # daily XLSX export (ExcelJS)
│   ├── csv.ts                                  # client-side CSV download util
│   └── debtConcepts.ts                         # label lookup for debt concepts (cuota/pensión/ropero/otro)
└── types/                                      # competition.ts, member.ts
```

`src/lib/adminSecret.ts` and `src/lib/auth/admin-secret.ts` are two different files despite the near-identical name: the first is a client-side helper (stores the secret in `sessionStorage`, wraps `fetch`), the second is the server-side route guard. Don't conflate them when reading or testing this codebase.

## Data model

Defined in `src/types/competition.ts` and `src/types/member.ts`. Schema in `src/lib/db/migrations/001_initial.sql` (competitions → competition_days → events/pruebas → binomios → registrations → waitlist) and `002_fase2_socios.sql` (members → member_debts, plus `payment_events` for the treasury ledger).

Key entities:
- **Competition / CompetitionDay / Event ("prueba")**: a competition spans one or more days, each day has one or more pruebas (jumping classes) riders register for.
- **Binomio**: a rider+horse pair, deduplicated by `findOrCreateBinomio` (`ON CONFLICT ... DO UPDATE` on email+horse — same pair reuses the same id across competitions, most-recent-name-wins on conflict).
- **Registration**: an inscripción to a specific prueba. Created with a 15-minute payment hold (`status: "pending"` + `hold_expires_at`), confirmed only by the Mercado Pago webhook, never by the frontend.
- **Member / MemberDebt**: a socio and their itemized debts (cuota, pensión, ropero, otro), each payable independently via its own Checkout Pro preference.
- **PaymentEvent**: an append-only ledger row inserted by the webhook for every approved payment (registration or member debt), deduplicated on `mp_payment_id` — this is what the treasury dashboard aggregates.

## Database (`src/lib/db/`)

- **`client.ts`**: a single `pg.Pool`, one module-level instance reused across requests (Next.js dev-mode HMR-safe via a global cache, same pattern as the common Prisma singleton workaround).
- **`queries/*.ts`**: one file per entity (`competitions`, `events`, `binomios`, `registrations`, `waitlist`, `members`, `paymentEvents`, `exportLogs`). All SQL lives here — no query strings elsewhere in the codebase.
- **`mappers.ts`**: converts snake_case DB rows to camelCase domain objects (`mapCompetitionRow`, `mapMemberRow`, `mapMemberDebtRow`, etc.).
- **`migrate.ts`** / **`migrations/*.sql`**: a minimal hand-rolled runner (no migration framework) — applies `.sql` files in filename order, tracked in a `schema_migrations` table.
- **Idempotency patterns used throughout**: `ON CONFLICT ... DO NOTHING`/`DO UPDATE` for webhook retries (`insertPaymentEvent` on `mp_payment_id`, `findOrCreateBinomio` on email+horse), and guarded `UPDATE ... WHERE x IS NULL` for one-way state transitions driven by the webhook (`confirmRegistration`, `markDebtPaid`) — a retried webhook call is always safe to re-run.

## Routing & API

| Route | Purpose |
|---|---|
| `/` | Redirects to `/concursos`. |
| `/concursos` | Public listing of open competitions. |
| `/concursos/[id]` | Anteprograma by day/prueba, inline inscripción with box reservation and payment countdown. |
| `/inscripcion/gracias` \| `/error` \| `/pendiente` | Post-checkout landing pages; `gracias` polls the registration status since Mercado Pago's redirect can arrive before the webhook has confirmed. |
| `/socios/[id]` | Public, permanent per-member link (non-enumerable UUID acts as the implicit credential — no socio login) showing debt breakdown and per-item payment. |
| `/admin` | Protected by `ADMIN_SECRET` (header or `?secret=` query param, see `requireAdminSecret`). Tabs: Anteprograma, Inscriptos, Sorteo, Deuda, Socios, Dashboard, Exportar. |
| `/api/competitions`, `/api/competitions/[id]`, `/api/competitions/[id]/debt/[binomioId]` | Public read endpoints. |
| `/api/registrations`, `/api/registrations/[id]` | Create/read a registration (creates the payment hold + Checkout Pro preference). |
| `/api/members`, `/api/members/[id]/debts`, `/api/members/debts/[debtId]/pay` | Public-by-design (same UUID-as-credential posture as the debt lookup route above). |
| `/api/admin/**` | All protected by `requireAdminSecret`: competitions CRUD, days/events CRUD, draw (`Fisher-Yates`, only once inscriptions are closed), registrations list, release-expired-holds (also accepts `Bearer <CRON_SECRET>` for the Vercel Cron caller), export, dashboard. |
| `/api/webhooks/mercadopago` | Single source of truth for payment confirmation — see below. |

### Registration & payment flow

1. `POST /api/registrations` calls `createRegistrationWithHold`: checks for an existing non-cancelled registration for the same binomio+prueba first, *then* checks remaining capacity (this ordering matters — checking capacity first would let a duplicate submission consume a slot before the duplicate-check ever ran) — returns `no_slots`, `duplicate`, or the created hold (`status: "pending"`, 15-minute `hold_expires_at`).
2. A Checkout Pro preference is created (`createCheckoutPreference` in `mercadopago.ts`) and the rider is redirected to Mercado Pago.
3. `releaseExpiredHolds` (called by `/api/admin/release-expired-holds`, wired to Vercel Cron in production and `npm run dev:cron` locally) releases any hold past its `hold_expires_at` back to available capacity and notifies the next waitlisted binomio, if any.
4. The Mercado Pago webhook is the **only** thing that confirms a registration or releases its slot on rejection — the frontend never assumes payment success from the checkout redirect alone, since Mercado Pago's redirect and webhook delivery are not ordered relative to each other.

### Mercado Pago integration

- **Checkout preferences**: `createCheckoutPreference` (registrations) and `createDebtCheckoutPreference` (member debts) in `src/lib/mercadopago.ts`, both using the plain UUID or a `member_debt:`-prefixed UUID as `external_reference` so the webhook can route without an extra DB lookup.
- **Webhook** (`src/app/api/webhooks/mercadopago/route.ts`): verifies the signature via `verifyWebhookSignature` (HMAC-SHA256 over `id:{id};request-id:{req};ts:{ts};`, using the official `mercadopago` SDK's `WebhookSignatureValidator`) before touching the DB. Branches on the `external_reference` prefix: no prefix → registration (`confirmRegistration` on `approved`, release + waitlist notification on `rejected`/`cancelled`); `member_debt:` prefix → `markDebtPaid`. Every approved payment is also inserted into `payment_events` (deduplicated on `mp_payment_id`). The route always returns `200`, even on an internal error, per Mercado Pago's own retry semantics — a non-200 response causes MP to retry indefinitely, which is the wrong failure mode for a bug on our side.

### Exportación legado y dashboard de tesorería

- **`GET /api/admin/export?competitionId&date`** (`src/lib/export.ts`): generates the daily XLSX the club's legacy desktop system imports, via ExcelJS; every generation is logged to `export_logs`. The exact column names the desktop import expects haven't been validated against the real legacy system yet — they're centralized in `sheet.columns` so they can be adjusted in one pass once confirmed.
- **`GET /api/admin/dashboard`**: aggregates `payment_events` into totals (by registration vs. member debt) and a recent-payments list, backing the admin panel's "Dashboard" tab.

## CSV export (`src/lib/csv.ts`)

A small, dependency-free client-side utility used by the "Inscriptos" and "Exportar" admin tabs: `downloadCsv(filename, rows)` builds an RFC-4180-escaped CSV string (quoting fields containing commas/quotes/newlines, doubling embedded quotes), prepends a UTF-8 BOM so Excel correctly renders accented Spanish characters, wraps it in a `Blob`, and triggers a download through a temporary anchor element. This is separate from the XLSX export above (`export.ts`) — CSV is a same-tab client-side download, XLSX is a server-generated file for the club's legacy import.

## Internationalization (`src/i18n/`)

- **`translations.ts`**: two flat nested objects (`es`, `en`), namespaced by feature area (`common`, `nav`, `footer`, `concursos`, `concursoDetail`, `inscripcionForm`, `inscripcionHold`, `inscripcionGracias`, `socios`, `admin`). Every key must exist in both languages — there's no fallback-to-English-string behavior; a missing key returns the dot-path itself (e.g. `"admin.someKey"`), which makes missing translations obvious during manual QA instead of silently degrading.
- **`LanguageContext.tsx`**: `LanguageProvider` holds `language` state defaulting to `"es"` (Spanish is the default language for the whole app), persisted to `localStorage`, read back in a `useEffect` on mount. Exposes `useLanguage()` (→ `{ language, setLanguage, t }`) and `useDateLocale()` (→ the matching `date-fns/locale` object, `es` or `enUS`).
- **`t(path, vars?)`**: dot-path lookup (`"namespace.key"`) with `{varName}` interpolation. No pluralization rules, ICU message format, or nesting beyond one level — deliberately minimal since the app's copy doesn't need more than that.

## Pitfalls and non-obvious decisions

- **Date parsing**: date-only columns (competition dates, debt due dates, etc.) are DATE columns in Postgres and are parsed with `date-fns`'s `parseISO`, **never** the native `new Date(...)` constructor. `new Date("2026-07-15")` is parsed as UTC midnight, and formatting it in a browser timezone behind UTC silently displays the *previous* day; `parseISO` parses date-only strings as local midnight instead, avoiding the bug. This was a real bug fixed during Fase 1 — see the `client.ts`/DATE-column handling for where it's guarded.
- **Two `Registration` types exist in the codebase** by name only — `types/competition.ts`'s `Registration` is the real one; if you ever see a reference to a `Registration` from `types/event.ts`, that was the retired demo app's type (removed — see below) and no longer exists.
- **Webhook idempotency is load-bearing, not defensive fluff.** `insertPaymentEvent`, `confirmRegistration`, `markDebtPaid` are all designed to be safely re-run with the same webhook payload (Mercado Pago retries on anything but a `200`). Any new webhook-driven write must follow the same `ON CONFLICT`/guarded-`UPDATE` pattern or a retry will double-count a payment or double-send an email.
- **Draw order (`sorteo`) is only ever run once inscriptions are closed** — `bulkSetDrawOrder` doesn't itself enforce this, the `/admin` "Sorteo" tab does, at the UI level.

## Known limitations

These are intentional scope boundaries, not oversights:

- **No real authentication.** `/admin` is protected by a single shared secret (`ADMIN_SECRET`), not a user-accounts system — anyone who has the secret has full admin access, and there's no per-user audit trail. **Do not expose the admin secret or deploy without HTTPS.** See `docs/fase1-setup.md`.
- **The socios portal and member-debt/registration lookup routes use a non-enumerable UUID as their only access control** (no socio login). This is an accepted tradeoff for a v1 with no user-accounts system — see `docs/fase2-4-setup.md` before treating this as more secure than it is.
- **WhatsApp notifications** (an optional item in the original Fase 4 scope) are out of scope — email via Resend is the only automated notification channel.
- **Legacy export column names are unconfirmed.** `export.ts`'s XLSX output hasn't been validated against the club's actual legacy desktop import yet.

## Retired: the original English demo app

Earlier in this project's history there was a separate, unrelated demo app (`/events`, `/my-events`, `/club`, English-language, `localStorage`-backed via `src/store/events.ts`, no backend) that coexisted alongside the real system described above. It has since been deleted entirely — there is no remaining code, route, or dependency (`uuid`) from it in this repository. If you find a reference to it in an old commit or a stale doc, it no longer applies.

## Further detail

- Fase 1 setup, environment variables, and what was verified without real Mercado Pago/Resend credentials: [`docs/fase1-setup.md`](./fase1-setup.md).
- Fases 2-4 (socios, export legado, dashboard) setup and testing: [`docs/fase2-4-setup.md`](./fase2-4-setup.md).
