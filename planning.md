# planning.md — Gap Analysis & Roadmap

Comparison of the Technical Brief ("Brief Técnico, Junio 2025" — source document: [`Brief_Tecnico_Sistema_Equitacion.docx`](./docs/Brief_Tecnico_Sistema_Equitacion.docx)) against the current Club Hípico Argentino codebase, and a proposed plan to close the gap.

> **Nota (Fase 1, actualización):** el stack que realmente se usó para construir Fase 1 difiere de la "Architecture Proposal" de este documento (que proponía Prisma + NextAuth.js). La spec del cliente en [`docs/claude_code_prompt_equestrian_v2.md`](./docs/claude_code_prompt_equestrian_v2.md) — más nueva y autoritativa que este planning — pide explícitamente **no usar ORM ni librería de auth**: se usó el driver `pg` sin ORM y un secreto compartido (`ADMIN_SECRET`) en vez de NextAuth. El resto del roadmap de abajo (Fases 2-4) queda como contexto histórico y no se actualizó — ver [`docs/architecture.md`](./docs/architecture.md#fase-1--sistema-de-concursos-capa-nueva-coexiste-con-lo-de-arriba) y [`docs/fase1-setup.md`](./docs/fase1-setup.md) para el estado real de Fase 1.

---

## 1. Gap analysis

### What the brief requires vs. what exists

| Brief module | Brief description | Current state | Gap |
|---|---|---|---|
| **Anteprograma** | Admin loads days, pruebas, categories, price per prueba, price per box | Only a flat `Event` with one price field and a broad category tag | New data model: Concurso → Día → Prueba → Categoría, plus Box pricing |
| **Inscripciones** | Rider (jinete) registers a binomio (horse+rider) to specific pruebas and reserves a box, via email | Registration captures horse/insurance/booklet fields but enrolls to the whole event, not per-prueba | Redesign: per-prueba enrollment, box reservation, binomio as the unit of registration |
| **Sorteo automático** | After registrations close, randomly draw competition order by group (día + prueba + categoría) | Not built | New module: close-registrations action + Fisher-Yates shuffle per group + store result |
| **Deuda por binomio** | Auto-calculate total owed per rider: Σ(prueba prices) + box price | Flat price per event, no billing module | New: debt calculation derived from inscripciones on demand |
| **Pago online** | Unique payment link per rider; MercadoPago Checkout Pro + Modo + débito; commission on payer | No payment processing at all | New integration: MercadoPago Checkout Pro API, requires a backend server to call MP API and receive webhooks |
| **Comprobante automático** | On payment webhook: send PDF receipt to rider's email, no manual step | No email, no PDF generation | New: email service (Resend/SendGrid) + PDF generation (jsPDF or react-pdf) |
| **Portal de socios** | Member views and pays their debt: cuotas, pensiones, roperos | No member/socio concept exists | New module (Fase 2): Socio entity + DeudaSocio + payment link |
| **Exportación al club** | Daily CSV/XLSX matching the club's desktop system format | CSV export exists (`src/lib/csv.ts`) but is per-event registrations only | Extend: daily structured export in the exact format the club's legacy system (FoxPro/Access) expects |
| **Dashboard Tesorería** | Real-time view: payments received, pending debt, enrolled binomios | Club panel shows registrant counts; no payment data | Extend `/club` with real payment tracking once Pago module exists |
| **Authentication** | Admin vs. jinete (rider) vs. socio (member) access | No auth — every page is open to everyone | New: role-based auth for all protected routes |
| **Backend / API** | API for MP webhooks, email sending, all writes | No backend; 100% localStorage | Critical: add real API layer |
| **Database** | Persistent, multi-device, shared data | `localStorage` only — single browser | Critical: PostgreSQL |

### What IS reusable from the current codebase

| Asset | Reuse value |
|---|---|
| **Next.js + TypeScript + Tailwind project setup** | Full reuse — same framework. Add API routes and Prisma in the same repo. |
| **Design system** (`globals.css`, saddle/forest/cream theme tokens, `.btn-primary`, `.card-hover`, `.input-field`, etc.) | Full reuse — branding and component styles carry over to every new screen |
| **UI components** (Navbar, Footer, EventCard card layout, CategoryFilter pill style, RegistrationModal form skeleton) | Adapt and extend — the form patterns, table patterns, and sidebar layout from the club panel all apply |
| **Horse/rider fields on Registration** (`horseName`, `insuranceExpiry`, `healthBookletExpiry`) | Direct carry-over — become Binomio fields in the new data model |
| **i18n system** (`src/i18n/`) | Full reuse — Spanish default, `t()` function, `useDateLocale()` |
| **CSV utility** (`src/lib/csv.ts`) | Reuse — extend for the daily club export |
| **Waitlist logic concepts** | Partial — `autoPromoteWaitlist`, FIFO ordering, capacity tracking inform the prueba capacity design |
| **Club panel** (`/club`) layout | Starting point for Dashboard Tesorería — extend with payment data once it exists |

---

## 2. Architecture proposal

### Stack (aligned with brief + existing codebase)

| Layer | Proposed choice | Rationale |
|---|---|---|
| Frontend | Next.js 16 (App Router) — already here | No change; add PWA manifest for mobile |
| API | **Next.js API routes** (`/app/api/...`) | Keeps everything in one repo/deployment; avoids a separate Express server; supports webhooks natively |
| ORM | **Prisma** | Best Next.js/TypeScript fit; auto-generates types from schema; migration files tracked in git |
| Database | **PostgreSQL** (Railway or Supabase) | As per brief; Prisma supports it natively |
| Auth | **NextAuth.js (Auth.js v5)** | Native App Router support; credential + magic-link providers; role field on User model |
| Payments | **MercadoPago Checkout Pro + webhooks** | Required by brief; Argentina-specific; commission passed to payer via preference `marketplace_fee` |
| Email | **Resend** | Easiest SDK, generous free tier, good DX for transactional emails |
| PDF | **@react-pdf/renderer** | Generates PDF in Node.js from React components; same mental model as the UI |
| Export | Extend existing `src/lib/csv.ts` + **ExcelJS** for XLSX | CSV utility already exists; ExcelJS for Excel-specific formatting needed by club's legacy system |
| Hosting | **Railway** | Supports Next.js, PostgreSQL add-on, environment variables, webhooks reachable; ~USD 15-20/month |

### New directory structure additions

```
src/
├── app/
│   ├── api/                        # NEW — all API endpoints
│   │   ├── concursos/              # CRUD for competitions
│   │   ├── inscripciones/          # Register binomio to prueba
│   │   ├── sorteo/                 # Trigger draw
│   │   ├── pagos/                  # Create MP preference, get status
│   │   ├── webhooks/mercadopago/   # MP payment confirmation → email PDF
│   │   ├── exportar/               # Daily CSV/XLSX generation
│   │   └── auth/                   # NextAuth handlers
│   ├── admin/                      # NEW — admin screens (anteprograma, dashboard)
│   ├── concurso/[id]/              # Public concurso detail + inscripción
│   ├── jinete/                     # Rider's registered binomios + payment link
│   └── socios/                     # Fase 2 — member portal
├── lib/
│   ├── csv.ts                      # Existing — extend for daily export
│   ├── xlsx.ts                     # NEW — ExcelJS daily export
│   ├── pdf.ts                      # NEW — PDF receipt generation
│   └── mercadopago.ts              # NEW — MP SDK wrapper
└── prisma/
    ├── schema.prisma               # NEW — full data model
    └── migrations/                 # NEW — tracked schema changes
```

---

## 3. Data model redesign (Prisma schema)

The core change: replace the flat `Event/Registration` model with a proper competition hierarchy. The **binomio** (horse+rider pair) is the unit that enrolls in **pruebas** and generates debt.

```
User
  id, email, passwordHash, role (ADMIN | JINETE | SOCIO), name

Concurso                          ← replaces "Event" for competition context
  id, title, location, dateStart, dateEnd, status (DRAFT | OPEN | CLOSED | COMPLETED)

Día
  id, concursoId, date, label (e.g. "Día 1 — Sábado")

Prueba                            ← a competition class within a day
  id, díaId, name, category (e.g. "1.20m"), price, capacity, status (OPEN | CLOSED)

Box
  id, concursoId, number, pricePerDay

Binomio                           ← the registration unit (horse + rider)
  id, userId (jinete), horseName, insuranceExpiry, healthBookletExpiry
  (one rider can have multiple binomios — different horses)

InscripciónPrueba                 ← binomio registered to a prueba
  id, binomioId, pruebaId, registeredAt, status (CONFIRMED | WAITLISTED | CANCELLED)

InscripciónBox                    ← binomio has a box reserved
  id, binomioId, boxId, días[] (which days), status

OrdenSorteo                       ← draw result per binomio within a group
  id, inscripciónPruebaId, position, drawnAt

Pago                              ← MercadoPago payment record
  id, binomioId, concursoId, amount, mpPaymentId, mpStatus, paidAt, receiptSentAt

── FASE 2 ──

Socio
  id, userId, memberNumber, name

DeudaSocio
  id, socioId, type (CUOTA | PENSION | ROPERO), period, amount, paidAt, mpPaymentId
```

**Key invariant carried forward**: `Prueba.capacity` is decremented only for CONFIRMED inscripciones, not WAITLISTED ones — same logic as the current `event.registered` counter, now enforced at the database level with a transaction.

---

## 4. Phased plan

### Fase 1 — MVP (6–8 weeks target)

Covers: Anteprograma · Inscripciones · Sorteo · Deuda · Link de pago MP · Comprobante email · Listado de boxes

#### Prerequisites (week 1)
- [ ] Add PostgreSQL: provision database on Railway, install Prisma, create `prisma/schema.prisma` with full Fase 1 model (Concurso, Día, Prueba, Box, Binomio, InscripciónPrueba, InscripciónBox, OrdenSorteo, Pago, User)
- [ ] Add NextAuth.js: `ADMIN` and `JINETE` roles; credential login + email magic-link for riders; protect `/admin/*` routes behind ADMIN session
- [ ] Remove localStorage dependency from all components; replace `src/store/events.ts` with API fetch calls
- [ ] Set up Railway deployment with environment variables (DATABASE_URL, NEXTAUTH_SECRET, MP keys, Resend key)

#### Anteprograma (week 1–2)
- [ ] `/admin/concursos` — create/edit concurso, add días, add pruebas per día (name, category, price, capacity), add boxes (number, price per day)
- [ ] API: `POST/PATCH /api/concursos`, `POST /api/dias`, `POST /api/pruebas`, `POST /api/boxes`
- [ ] Status flow: DRAFT → OPEN (opens public inscripción) → CLOSED (triggers sorteo) → COMPLETED

#### Inscripciones (week 2–3)
- [ ] `/concurso/[id]` — public page showing concurso days, pruebas, box availability
- [ ] Rider creates/selects a binomio (horse+rider), enrolls in one or more pruebas per día, optionally reserves a box
- [ ] Extend the existing `RegistrationModal` form pattern — fields (horseName, insuranceExpiry, healthBookletExpiry) already exist, add prueba multi-select and box picker
- [ ] API: `POST /api/inscripciones` — transactional: create InscripciónPrueba rows + InscripciónBox + update Prueba.capacity; if full → status WAITLISTED
- [ ] `/jinete` — rider dashboard showing their binomios, enrolled pruebas, box, and payment status

#### Sorteo automático (week 3)
- [ ] Admin button on `/admin/concursos/[id]`: "Cerrar inscripciones y sortear"
- [ ] API: `POST /api/sorteo` — for each group (día + prueba + categoría): fetch CONFIRMED inscripciones, shuffle positions using Fisher-Yates with `crypto.getRandomValues()` (no `Math.random()` for fairness), write OrdenSorteo rows
- [ ] Display draw results on the public concurso page, sortable/filterable by day and prueba

#### Deuda por binomio (week 3–4)
- [ ] API: `GET /api/deuda/[binomioId]` — computes: Σ(InscripciónPrueba.prueba.price) + Σ(InscripciónBox.box.pricePerDay × días) minus any confirmed Pago.amount
- [ ] Show computed debt on `/jinete` and on the admin club panel

#### Pago online — MercadoPago (week 4–5)
- [ ] `src/lib/mercadopago.ts` — wrapper around the official `mercadopago` Node SDK
- [ ] API: `POST /api/pagos/crear-preferencia` — create MP Checkout Pro preference with `unit_price = deuda total`, `external_reference = binomioId+concursoId`, `notification_url = /api/webhooks/mercadopago`; commission on payer via preference config
- [ ] Rider visits `/pagar/[binomioId]` → rendered MP checkout button/redirect
- [ ] API: `POST /api/webhooks/mercadopago` — receive MP webhook: verify signature, get payment, update Pago record, trigger comprobante email
- [ ] Admin can also generate and copy payment links from the club panel

#### Comprobante automático (week 5)
- [ ] `src/lib/pdf.ts` — `@react-pdf/renderer` template: club logo, binomio name, pruebas enrolled, amount paid, MP payment ID, date
- [ ] Triggered inside webhook handler: `resend.emails.send({ to: rider.email, attachments: [pdf] })`
- [ ] Record `Pago.receiptSentAt` so the club panel can show "comprobante enviado ✓"

#### Listado de boxes + club panel updates (week 5–6)
- [ ] `/admin/concursos/[id]/boxes` — who has which box, filter by day, exportable
- [ ] Extend `/club` with: payment totals, pending debt, binomios enrolled per prueba, comprobante sent status
- [ ] Reuse/extend existing `downloadCsv` + add ExcelJS for XLSX in `src/lib/xlsx.ts`

#### Testing / buffer (week 6–8)
- [ ] End-to-end test with real MercadoPago sandbox credentials
- [ ] Webhook delivery testing (ngrok in dev, Railway URL in staging)
- [ ] Pilot concurso run with real data

---

### Fase 2 — Portal de socios (4–5 weeks)

- [ ] `Socio` and `DeudaSocio` models added to Prisma schema (migration)
- [ ] Auth: add `SOCIO` role; socio logs in with email magic-link (no password needed)
- [ ] `/socios/[id]` — permanent link; shows debt breakdown (cuotas, pensiones, roperos) by period
- [ ] Admin: `/admin/socios` — import or manually enter socio debt records
- [ ] Payment flow: same MP integration as Fase 1 but `external_reference = socioId + period`
- [ ] PDF comprobante for socio payments via same `src/lib/pdf.ts` template

---

### Fase 3 — Exportación automática al club (3–4 weeks)

The legacy desktop system (FoxPro/Access/Delphi) has no API — integration is file-based.

- [ ] Define the exact column schema the club's desktop system expects (requires one session with the club to inspect the legacy import format)
- [ ] `src/lib/xlsx.ts` — daily export: one sheet per day, rows = binomio + pruebas + box + payment status; column names matching the desktop import wizard exactly
- [ ] API: `GET /api/exportar/[concursoId]/[date]` — generates the file server-side, streams it as a download
- [ ] Admin one-click button on `/admin/concursos/[id]`: "Exportar planilla del día" (replaces the current `/club` CSV button with a richer XLSX)
- [ ] Optional: scheduled job (Railway cron or Vercel cron) that auto-generates and emails the export to a club admin address at end of each competition day (23:59 ART)

---

### Fase 4 — Dashboard Tesorería + UX + WhatsApp (4–6 weeks)

- [ ] Dashboard at `/admin/tesoreria`: totals (pagado / pendiente / por categoría / por día), binomios chart, payment timeline; built with existing table + card components, data from existing Pago records
- [ ] UX improvements identified during pilot concurso
- [ ] WhatsApp notifications (optional): Twilio WhatsApp API or `whatsapp-business-api`; notify rider on registration confirmed, payment link, payment confirmed — same trigger points as existing email hooks

---

## 5. New dependencies (Fase 1)

```bash
npm install prisma @prisma/client          # ORM + PostgreSQL
npm install next-auth@beta                 # Auth.js v5 (App Router compatible)
npm install mercadopago                    # Official MP Node SDK
npm install resend                         # Email
npm install @react-pdf/renderer            # PDF receipts
npm install exceljs                        # XLSX export (Fase 3)
```

No frontend framework change — React, Tailwind, lucide-react, date-fns, uuid all stay.

---

## 6. Infrastructure

| Concern | Solution |
|---|---|
| Database | PostgreSQL add-on on Railway (starts free, ~USD 5/mo for production) |
| Hosting | Railway single service — one Next.js app serving frontend + API routes |
| Webhooks | Railway gives a stable HTTPS URL; set `notification_url` in MP preference to `https://[railway-domain]/api/webhooks/mercadopago` |
| Secrets | `DATABASE_URL`, `NEXTAUTH_SECRET`, `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET`, `RESEND_API_KEY` stored as Railway env vars |
| MP commission passthrough | Set via `marketplace_fee` or `processing_mode` in preference; verify current MP Argentina policy for commission-on-payer config |
| Timezone | Argentina is UTC-3 (no DST). Store all timestamps as UTC in PostgreSQL; display in ART using `date-fns-tz` |

---

## 7. Scope that remains unchanged

These parts of the current codebase need **no rework** beyond cosmetic changes:

- `src/app/globals.css` — design tokens, typography, equestrian color palette
- `src/components/Navbar.tsx`, `Footer.tsx` — layout shell
- `src/i18n/` — full i18n system (Spanish default, English toggle)
- `src/lib/csv.ts` — extended but not replaced
- `src/components/EventCard.tsx` card layout — reuse pattern for concurso cards on the public listing

The pages at `/events`, `/events/create`, `/events/[id]`, `/my-events`, and `/club` will be reworked or replaced by the new competition-aware routes — but their UI patterns (hero headers, sidebar registration, table with action buttons, category pills) all carry over visually.
