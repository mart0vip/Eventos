# Equestrian Events

A horse-riding event management platform — inspired by Wix Events, with an equestrian look and feel and a few features built specifically for hípica clubs: per-category registrant views, waitlist management, and horse/insurance/health-booklet fields on every registration.

Everything runs client-side with no backend — data is stored in your browser's `localStorage`. See [`architecture.md`](./architecture.md) for the full technical write-up (data model, store design, capacity/waitlist logic, i18n, known limitations).

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

> **Note:** All data (events and registrations) lives in your browser's `localStorage`, scoped to `http://localhost:3000`. Clearing site data / using a different browser or profile starts you over with the demo events. There is no backend, no shared database, and no login — see [`architecture.md`](./architecture.md#known-limitations) for what that means in practice.

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

No external i18n or state-management library — both are small custom implementations (`src/i18n/`, `src/store/events.ts`) sized to fit this app. Details and rationale in [`architecture.md`](./architecture.md).
