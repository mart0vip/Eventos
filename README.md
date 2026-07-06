# Club Hípico Argentino

A horse-riding event management platform — inspired by Wix Events, with an equestrian look and feel and a few features built specifically for hípica clubs: per-category registrant views, waitlist management, and horse/insurance/health-booklet fields on every registration.

Everything runs client-side with no backend — data is stored in your browser's `localStorage`. See [`docs/architecture.md`](./docs/architecture.md) for the full technical write-up (data model, store design, capacity/waitlist logic, i18n, known limitations).

**New here? Start with:** this README for what the app does today, [`docs/architecture.md`](./docs/architecture.md) for how it's built, and [`planning.md`](./planning.md) for the gap analysis and roadmap toward the full club system described in the source brief ([`Brief_Tecnico_Sistema_Equitacion.docx`](./docs/Brief_Tecnico_Sistema_Equitacion.docx)).

## Features

### Browse & discover events
- Landing page with featured events, upcoming events, and a category grid (Salto de Obstáculos, Doma Clásica, Cross Country, Polo, Rodeo, Cabalgata, Clínica y Taller, Subasta de Caballos, Reunión Social, Otro).
- `/events` — full listing with text search, category filter, price filter (free/paid), and sorting (date, price, popularity).
- Each event page shows full details, capacity, an interactive registration sidebar, and similar events from the same category.

### Register for an event
- Registration form captures rider info (name, email, phone, ticket count, notes) plus hípica-specific fields: **horse name**, **insurance validity (vigencia de seguro)**, and **health booklet validity (vigencia de libreta sanitaria)**.
- If an event is full, the form doesn't block you — it switches to "Join Waitlist" and your registration is added to the event's waitlist instead of being rejected.
- `/my-events` shows every registration made in this browser, with status (confirmed/cancelled) and a cancel action.

### Create an event
- `/events/create` — a full event builder: title, description, category, date/time, location, pricing, capacity, image, tags, and a "featured" flag.

### Club management panel (`/club`)
- **Inscriptos por categoría**: see confirmed and waitlisted registrant counts grouped by event category, across the whole club.
- **Per-event view**: pick any event to see its confirmed registrants and waitlist as tables, including each rider's horse name and insurance/health-booklet expiry dates — **expired documents are flagged in red** automatically.
- **Waitlist management**: promote a waitlisted rider to confirmed with one click, or turn on automatic promotion per event (the next person on the waitlist is confirmed automatically whenever a confirmed spot is cancelled).
- **Export Planilla**: download an event's confirmed-registrant list as a CSV spreadsheet (opens cleanly in Excel/Google Sheets, including accented characters).

### Bilingual (Spanish / English)
- The whole app is translated. **Spanish is the default language.** Switch languages from the flag selector in the top-right corner of the navbar — your choice is remembered between visits.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first time the app loads, it seeds your browser's `localStorage` with 8 demo events so there's something to browse immediately.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # eslint
```

> **Note:** All data (events and registrations) lives in your browser's `localStorage`, scoped to `http://localhost:3000`. Clearing site data / using a different browser or profile starts you over with the demo events. There is no backend, no shared database, and no login — see [`docs/architecture.md`](./docs/architecture.md#known-limitations) for what that means in practice.
>
> **⚠️ Security:** `/club` has no access control and displays registrants' personal data (email, phone, horse name, insurance/health-booklet dates) to any visitor, plus unprotected cancel/promote actions. Do not deploy this publicly with real people's data until `/club` is gated behind real authentication.

## How to use it

**As a rider:**
1. Browse `/events` or the homepage, open an event you like.
2. Click "Inscribirse Ahora" (or "Join Waitlist" if the event is full) and fill in your details, including your horse's name and your insurance/health booklet expiry dates.
3. Check `/my-events` any time to see or cancel your registrations.

**As a club organizer:**
1. Create an event from `/events/create`.
2. As people register, open `/club` to see who's signed up.
3. Pick your event from the dropdown to see the confirmed list and waitlist. Promote waitlisted riders manually, or check "Promoción automática de lista de espera" to have the next person auto-confirmed whenever someone cancels.
4. Click "Exportar Planilla" to download the confirmed-registrant list as a CSV for printing, sharing, or importing elsewhere.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · date-fns · lucide-react · uuid

No external i18n or state-management library — both are small custom implementations (`src/i18n/`, `src/store/events.ts`) sized to fit this app. Details and rationale in [`docs/architecture.md`](./docs/architecture.md).

## Sistema de Concursos y Socios (`/concursos`, `/socios`, `/admin`)

Además de la app de eventos original (arriba), este repo incluye el sistema de concursos de equitación construido a partir de `docs/claude_code_prompt_equestrian_v2.md`: inscripción a pruebas con pago online (Mercado Pago), sorteo, cálculo de deuda por binomio, portal de socios con cobro de cuotas/pensiones/roperos, exportación diaria al sistema legado del club, dashboard de tesorería y un panel de administración. Es un sistema **paralelo** al de arriba — no reemplaza ni migra `src/store/events.ts` — con su propio backend en Postgres.

**Setup local:**

```bash
docker compose up -d        # levanta Postgres local
npm install
npm run db:migrate          # crea el schema
npm run db:seed             # (opcional) datos de prueba
npm run dev
```

En otra terminal, si querés probar el vencimiento de holds sin esperar el cron de producción:

```bash
npm run dev:cron
```

Copiá `.env.example` a `.env.local` y completá las variables (ver [`docs/fase1-setup.md`](./docs/fase1-setup.md) para el detalle completo, incluyendo dónde conseguir las credenciales reales de Mercado Pago y Resend).

**Estado:** Fases 1-4 completas — Fase 1 (inscripciones, pagos, sorteo, deuda, panel admin, export CSV — ver [`docs/fase1-setup.md`](./docs/fase1-setup.md)), Fase 2 (portal de socios `/socios/[id]` con pago online), Fase 3 (export XLSX diario al sistema legado, pendiente validar el formato exacto de columnas con el club) y Fase 4 (dashboard de tesorería). Detalle de las Fases 2-4: [`docs/fase2-4-setup.md`](./docs/fase2-4-setup.md). Las notificaciones por WhatsApp (ítem opcional de Fase 4) quedaron fuera de alcance.

**Tech stack adicional:** PostgreSQL (`pg`, sin ORM) · Mercado Pago Checkout Pro · Resend · zod · ExcelJS.

**Deploy a producción:** ver [`DEPLOY.md`](./DEPLOY.md) (Vercel).

> **⚠️ Seguridad:** el panel `/admin` está protegido por un secreto compartido simple (`ADMIN_SECRET`), no por un sistema de usuarios real — ver `docs/fase1-setup.md` antes de exponerlo públicamente.
