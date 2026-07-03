# Architecture

This document explains how Equestrian Events is built and why, so future changes stay consistent with the existing design.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | File-based routing, fast dev server, no need for a custom build setup. |
| Language | TypeScript | Static types for `Event`/`Registration` shapes shared across every page. |
| UI | React 19, all components `"use client"` | The app has no server-rendered data — every page reads from `localStorage`, so there's no benefit to Server Components here. |
| Styling | Tailwind CSS v4 with a custom `@theme` | Equestrian color palette (saddle brown, forest green, cream, gold) and reusable utility classes (`.btn-primary`, `.card-hover`, `.input-field`, etc.) defined once in `src/app/globals.css`. |
| Icons | lucide-react | Lightweight, tree-shakeable icon set. |
| Dates | date-fns (+ `date-fns/locale`) | Locale-aware formatting (`es`/`en`) and `parseISO` for correct date-only parsing (see [Pitfalls](#pitfalls-and-non-obvious-decisions)). |
| IDs | uuid | Client-generated IDs for events/registrations since there's no backend to assign them. |
| Persistence | `localStorage` | No backend exists. `src/store/events.ts` is the entire data layer. |
| i18n | Custom React Context (`src/i18n/`) | No locale-routing requirement, so a full library (`next-intl`) would add routing/middleware complexity the app doesn't need. |

There is **no backend, no database, and no authentication**. Every route is reachable by anyone; all "admin" actions in the club panel are open to all visitors. This is a deliberate scope boundary — see [Known limitations](#known-limitations).

## Directory layout

```
src/
├── app/                    # Next.js App Router pages (one folder per route)
│   ├── page.tsx                  → /
│   ├── events/page.tsx           → /events            (browse/search/filter)
│   ├── events/[id]/page.tsx      → /events/:id         (detail + registration)
│   ├── events/create/page.tsx    → /events/create      (event creation form)
│   ├── my-events/page.tsx        → /my-events          (rider's own registrations)
│   ├── club/page.tsx             → /club               (club management panel)
│   ├── layout.tsx                # Root layout — wraps everything in LanguageProvider
│   └── globals.css               # Tailwind theme tokens + custom utility classes
├── components/              # Shared, reusable UI pieces
├── i18n/                     # Translation dictionary + LanguageContext
├── lib/                      # Generic, framework-agnostic utilities (CSV export)
├── store/                    # The entire data layer (localStorage read/write)
└── types/                    # Shared TypeScript interfaces (Event, Registration)
```

## Data model

Defined in `src/types/event.ts`.

### `Event`

The core entity. Created via the "Create Event" form or seeded as demo data.

```ts
interface Event {
  id, title, description, date, endDate?, time, endTime?,
  location, address, category: EventCategory, image,
  price, currency, capacity, registered, organizer, tags[],
  status: "upcoming" | "ongoing" | "past" | "cancelled",
  isFeatured: boolean, createdAt,
  autoPromoteWaitlist?: boolean,   // per-event waitlist behavior, see below
}
```

`registered` is a **denormalized counter** — it only counts `"confirmed"` registrations' ticket counts, kept in sync by `src/store/events.ts` every time a registration is created, cancelled, or promoted. It is never derived on the fly from the registrations list, to keep capacity checks (`event.registered + tickets > event.capacity`) a cheap O(1) comparison.

`EventCategory` is a fixed union (`show-jumping`, `dressage`, `cross-country`, `polo`, `rodeo`, `trail-ride`, `clinic`, `auction`, `social`, `other`). Each category has a fixed emoji icon (`categoryIcons`, language-independent) and a translated label (`t('categories.<key>')`, language-dependent) — icons and labels are deliberately split between `types/event.ts` and `i18n/translations.ts` so adding a language never touches the icon set.

### `Registration`

```ts
interface Registration {
  id, eventId, name, email, phone, tickets, notes,
  horseName, insuranceExpiry, healthBookletExpiry,
  registeredAt,
  status: "confirmed" | "pending" | "cancelled" | "waitlisted",
}
```

`horseName`, `insuranceExpiry`, `healthBookletExpiry` are hípica-specific fields captured at registration time (not bolted on after the fact) — this is what differentiates the registration form from a generic Wix Events form, and what the club panel surfaces/flags/exports.

`"pending"` exists in the type union for forward-compatibility (e.g. a future payment-confirmation step) but nothing currently sets it — every registration is created as either `"confirmed"` or `"waitlisted"`.

## The store: `src/store/events.ts`

This file is the single source of truth for all reads/writes. Every component goes through it — no component touches `localStorage` directly.

- **Two keys**: `equestrian_events` and `equestrian_registrations`, each a flat JSON array.
- **`initializeEvents()`**: seeds `equestrian_events` with 8 demo events (in Spanish) the first time the app runs, if the key doesn't exist yet. Called once per page mount (idempotent — does nothing if data already exists).
- **Read functions** (`getEvents`, `getEvent`, `getFeaturedEvents`, `getEventsByCategory`, `searchEvents`, `getRegistrations`, `getWaitlist`) are pure: read from storage, filter/sort, return. No caching layer — every call re-reads `localStorage` and re-parses JSON. This is intentionally simple; the dataset is small (a handful of events/registrations) so the cost is negligible, and avoiding a cache sidesteps any staleness bugs between tabs/components.
- **Write functions** (`createEvent`, `updateEvent`, `deleteEvent`, `registerForEvent`, `cancelRegistration`, `promoteFromWaitlist`) read the full array, mutate it in memory, and write the whole array back. There's no concurrency control because there's only one writer (the current browser tab).

### Capacity & waitlist logic

This is the most stateful part of the app, so it's worth spelling out exactly:

1. **`registerForEvent`**: computes `wouldExceedCapacity = event.registered + tickets > event.capacity`. If true → registration saved with `status: "waitlisted"`, and `event.registered` is **not** incremented (waitlisted people don't count against capacity). If false → `status: "confirmed"`, `event.registered += tickets`.
2. **`cancelRegistration`**: only decrements `event.registered` if the registration being cancelled was `"confirmed"` (cancelling an already-waitlisted or already-cancelled registration is a no-op on capacity). If the event has `autoPromoteWaitlist: true`, it then automatically promotes the earliest waitlisted registration (FIFO by `registeredAt`) via `promoteFromWaitlist`.
3. **`promoteFromWaitlist`**: flips a registration to `"confirmed"` and increments `event.registered`. This always succeeds when called — there's no re-check against capacity, because the only caller (the club panel's "Promover" button, or the auto-promote path after a cancellation) is acting on a freshly-freed spot. A club staffer can still manually promote someone even if it overbooks the event; this is intentional (trust the human decision over a hard rule).
4. **`getWaitlist(eventId)`**: returns waitlisted registrations sorted oldest-first — this ordering **is** the waitlist position; there's no separate `position` field.

Waitlist promotion is **manual by default** (club panel "Promover" button) with an explicit per-event opt-in (`Event.autoPromoteWaitlist`, toggled from the club panel) for automatic promotion. This was a deliberate product decision — see the planning history for this feature if you need the reasoning.

## Routing & pages

| Route | Purpose | Notable behavior |
|---|---|---|
| `/` | Landing page | Hero, featured events, upcoming events, category grid, feature highlights. |
| `/events` | Browse/search | Wrapped in `<Suspense>` because it reads `useSearchParams()` (for `?q=` and `?category=` deep links from the homepage). |
| `/events/[id]` | Event detail + registration | Branches its post-registration success UI on the registration's returned `status` (`"confirmed"` vs `"waitlisted"`) — see [Registration flow](#registration-flow). |
| `/events/create` | Create event | Plain form → `createEvent()` → redirect to the new event's detail page. |
| `/my-events` | Rider's registrations | Reads **all** registrations from storage (no user accounts, so "my" really means "every registration ever made in this browser") and joins each to its event. |
| `/club` | Club management panel | See below. |

### Registration flow

`RegistrationModal` is a shared component opened from `/events/[id]`. On submit it calls `registerForEvent()` and passes the **resulting status** back up via `onSuccess(status)` — the caller never assumes success means "confirmed". The modal's own UI also reacts to capacity before submission: when `spotsLeft <= 0` the submit button is **not disabled**, it relabels itself "Unirme a la Lista de Espera" / "Join Waitlist" and the form still submits (intentionally — registering into a full event is exactly how the waitlist gets populated; disabling submission would make the waitlist feature unreachable from the public side).

### Club management panel (`/club`)

**No auth gate — open to anyone.** Unlike the rest of the app (where "open to anyone" just means no login), this screen surfaces personal data and destructive actions, so this is a real exposure, not just a UX gap — see [Known limitations](#known-limitations). It is the only screen that:
- Aggregates registrations **across all events**, grouped by `EventCategory` (counts of confirmed vs. waitlisted), answering "how many people are registered per category club-wide."
- Lets staff select a single event and see/manage its confirmed registrants and waitlist as tables, with expired `insuranceExpiry`/`healthBookletExpiry` visually flagged (red text + "(vencido)"/"(expired)") by comparing against `new Date()` at render time — flagging is purely a UI concern, the raw dates are unaffected.
- Exposes `cancelRegistration` and `promoteFromWaitlist` as row-level actions, and `autoPromoteWaitlist` as a per-event checkbox (persisted via `updateEvent`).
- Exports the confirmed-registrant table as CSV via `downloadCsv()`.

## CSV export (`src/lib/csv.ts`)

A small, dependency-free utility: `downloadCsv(filename, rows)` builds an RFC-4180-escaped CSV string (quoting fields containing commas/quotes/newlines, doubling embedded quotes), prepends a UTF-8 BOM (`﻿`) so Excel correctly renders accented Spanish characters, wraps it in a `Blob`, and triggers a download through a temporary anchor element. No server round-trip — this only works because the data already lives in the browser.

Column headers in the exported CSV are the **translated** column labels (`t('club.col*')`) for the language active at export time, not hardcoded English — so a Spanish-language session exports a Spanish-header CSV.

## Internationalization (`src/i18n/`)

- **`translations.ts`**: two flat nested objects (`es`, `en`), each namespaced by feature area (`nav`, `footer`, `hero`, `categories`, `eventCard`, `registration`, `home`, `eventsPage`, `eventDetail`, `createEvent`, `myEvents`, `club`). Every key must exist in both languages — there's no fallback-to-English-string behavior; a missing key returns the dot-path itself (e.g. `"club.colName"`), which makes missing translations obvious during manual QA instead of silently degrading.
- **`LanguageContext.tsx`**: `LanguageProvider` holds `language` state defaulting to `"es"` (Spanish is the default language for the whole app), persisted to `localStorage["equestrian_language"]`, read back in a `useEffect` on mount (client-only, matching the same pattern as `initializeEvents`). Exposes `useLanguage()` (→ `{ language, setLanguage, t }`) and `useDateLocale()` (→ the matching `date-fns/locale` object, `es` or `enUS`).
- **`t(path, vars?)`**: dot-path lookup (`"namespace.key"`) with `{varName}` interpolation (e.g. `t("eventCard.spotsLeft", { n: 3 })` → `"¡quedan 3 lugares!"`). No pluralization rules, ICU message format, or nesting beyond one level — deliberately minimal since the app's copy doesn't need more than that.
- Every component that renders user-facing text is a client component calling `useLanguage()` — there are no server-rendered translated strings.

## Pitfalls and non-obvious decisions

- **Date parsing**: `event.date`/`event.endDate` are date-only strings (`"2026-07-15"`). They are parsed with `date-fns`'s `parseISO`, **never** the native `new Date(...)` constructor. `new Date("2026-07-15")` is parsed as UTC midnight, and formatting it in a browser timezone behind UTC silently displays the *previous* day. `parseISO` parses date-only strings as local midnight instead, avoiding the bug. Full timestamps (`registeredAt`, `createdAt`) don't have this problem and are parsed with the native constructor as usual.
- **`event.registered` is a counter, not a derived value.** If you add a new code path that changes registration status, you must update `event.registered` there too (see [Capacity & waitlist logic](#capacity--waitlist-logic)) — it will not "just work" by recomputing from the registrations array.
- **No `next/font`, no Geist font.** The default `create-next-app` font setup was replaced with Tailwind theme tokens (`--font-heading`: Georgia serif, `--font-body`: system sans) to fit the equestrian branding.
- **Seed data is Spanish-only**, not bilingual. The 8 demo events were deliberately rewritten in Spanish rather than maintained as parallel `es`/`en` datasets — they're static demo content, not something a real club would expect to be auto-translated (real event titles/descriptions are user-generated, like the UI's own copy, not app chrome).

## Known limitations

These are intentional scope boundaries, not oversights:

- **No authentication.** `/club` and `/events/create` are reachable by anyone. **Do not deploy this app publicly with real registrant data before adding auth** — `/club` exposes riders' PII (name, email, phone, horse name, insurance/health-booklet dates) to any visitor and lets them cancel registrations, promote waitlists, and toggle auto-promotion with no access control. Gating `/club` behind real auth is a prerequisite, not a nice-to-have, before an actual club uses this with real people's data.
- **No backend / no multi-device sync.** Everything lives in one browser's `localStorage`. Registering on a phone and checking `/my-events` on a laptop will show nothing — there's no shared source of truth.
- **No payment processing.** Prices are displayed and summed but `registerForEvent` never charges anything.
- **No image upload.** Event images are URLs (defaults provided per category, or a user-supplied URL) — there's no file upload/storage.

## Fase 1 — Sistema de Concursos (capa nueva, coexiste con lo de arriba)

Todo lo descripto hasta acá (rutas `/`, `/events*`, `/my-events`, `/club`, el store en `src/store/events.ts`) sigue existiendo tal cual y **no se tocó**. A partir de la especificación en `docs/claude_code_prompt_equestrian_v2.md` se agregó, en paralelo, un segundo sistema con su propio backend:

- **Datos:** PostgreSQL real (`src/lib/db/`, driver `pg` sin ORM) en vez de `localStorage`. Ver `src/lib/db/migrations/001_initial.sql` para el schema completo (competitions → competition_days → events/pruebas → binomios → registrations → waitlist).
- **Tipos:** `src/types/competition.ts` — a propósito **no** reutiliza los nombres `Event`/`Registration` de `src/types/event.ts` (son conceptos distintos: el nuevo `Registration` representa una inscripción a una prueba con pago vía Mercado Pago, no tiene relación con el `Registration` viejo).
- **Rutas nuevas:** `/concursos`, `/concursos/[id]`, `/inscripcion/gracias|error|pendiente` (público) y `/admin` (protegido por `ADMIN_SECRET`, ver `src/lib/auth/admin-secret.ts`), más toda la API en `src/app/api/`.
- **Por qué hay dos "Registration" en el código:** si en algún momento un archivo necesita importar ambos tipos, hay que aliasear uno (`import { Registration as LegacyRegistration } from "@/types/event"`) — documentado también en el propio `src/types/competition.ts`.

Detalle completo de setup, variables de entorno y qué se pudo verificar sin credenciales reales de Mercado Pago/Resend: [`docs/fase1-setup.md`](./fase1-setup.md).
