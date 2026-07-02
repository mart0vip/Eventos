# Claude Code Prompt — Sistema de Concursos de Equitación
## Club de Equitación · Argentina · Fase 1 MVP + estructura base Fases 2-4

---

## Contexto del proyecto

Estás construyendo un sistema web para un club de equitación argentino que organiza concursos periódicos y gestiona cobros a socios. El proceso actual es completamente manual. El objetivo es digitalizar y automatizar el flujo completo desde la inscripción del jinete hasta el cobro online y el registro administrativo.

**Restricción de integración crítica:** el sistema administrativo del club es una aplicación desktop legacy (Visual FoxPro / Access / Delphi) sin API. La integración se realiza exclusivamente mediante archivos CSV/XLSX exportados diariamente desde el nuevo sistema. No intentar ninguna integración directa.

El sistema se construye en **4 fases**. Este prompt implementa **Fase 1 completa** y deja **scaffolding extensible** para las fases siguientes, sin implementarlas.

---

## Stack tecnológico

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Styling:** Tailwind CSS v4 con tema hípico ya definido (tokens: saddle browns, forest greens, cream). No agregar nuevas variables de color.
- **Icons:** lucide-react
- **Fechas:** date-fns con locales `es`/`en`
- **IDs:** uuid
- **i18n:** React Context custom en `src/i18n/` — sin librería externa. Todos los strings de usuario van aquí, nunca hardcodeados en JSX.
- **Base de datos:** PostgreSQL via `pg` (driver nativo, sin ORM)
- **Data layer actual:** `localStorage` via `src/store/events.ts` — no modificar, puede coexistir
- **Pagos:** Mercado Pago Checkout Pro + Webhooks
- **Email:** Resend (comprobantes automáticos)
- **Exportación:** ExcelJS (CSV/XLSX para sistema legacy del club)
- **Validación:** zod (agregar si no está presente)

**No usar:** Prisma, NextAuth, ningún ORM, ninguna librería de auth. No agregar paquetes fuera de los listados salvo `pg`, `zod`, `mercadopago`, `resend`, `exceljs`, `@types/pg`.

---

## Variables de entorno

Crear `.env.example` con todas las siguientes. Nunca hardcodear valores:

```
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Mercado Pago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
MP_PUBLIC_KEY=

# App
NEXT_PUBLIC_BASE_URL=https://club.example.com
ADMIN_SECRET=           # header x-admin-secret para rutas de admin

# Email
RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=noreply@club.example.com
```

---

## 1. Base de datos — Schema completo

Crear `src/lib/db/migrations/001_initial.sql` y un script `src/lib/db/migrate.ts` que lo ejecute con `pg`.

### Dominio central

```sql
-- Concursos (el evento completo — un fin de semana de competición)
CREATE TABLE competitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  date_from     DATE NOT NULL,
  date_to       DATE NOT NULL,
  location      TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'draft',
    -- draft | open | closed | cancelled
  box_price_ars INTEGER NOT NULL DEFAULT 0,  -- precio del box en centavos ARS
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Días del concurso (el "anteprograma" se estructura por día)
CREATE TABLE competition_days (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  day_date       DATE NOT NULL,
  day_label      TEXT NOT NULL,  -- ej. "Día 1 - Sábado"
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Pruebas dentro de un día (ej. "Prueba 1 - Salto 1.10m")
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id          UUID NOT NULL REFERENCES competition_days(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,    -- ej. "Salto 1.10m", "Doma Nivel 2"
  price_ars       INTEGER NOT NULL, -- precio de inscripción en centavos ARS
  total_slots     INTEGER NOT NULL,
  available_slots INTEGER NOT NULL,
  draw_done       BOOLEAN NOT NULL DEFAULT false,  -- true una vez ejecutado el sorteo
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT available_slots_non_negative CHECK (available_slots >= 0)
);

-- Binomios (jinete + caballo — unidad de participación)
-- Un jinete puede tener múltiples caballos; un caballo puede tener un solo jinete activo
CREATE TABLE binomios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_name  TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  horse_name        TEXT NOT NULL,
  license_number    TEXT,           -- licencia federada (opcional)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inscripciones (un binomio se inscribe a una prueba)
CREATE TABLE registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id),
  binomio_id      UUID NOT NULL REFERENCES binomios(id),
  box_requested   BOOLEAN NOT NULL DEFAULT false,
  draw_order      INTEGER,          -- asignado por el sorteo; NULL hasta que se ejecute
  status          TEXT NOT NULL DEFAULT 'pending_payment',
    -- pending_payment | confirmed | cancelled | waitlisted
  hold_expires_at TIMESTAMPTZ,      -- NULL una vez confirmado o cancelado
  mp_preference_id TEXT,
  mp_payment_id    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at     TIMESTAMPTZ,
  UNIQUE (event_id, binomio_id)     -- un binomio no puede inscribirse dos veces a la misma prueba
);

-- Lista de espera (separada para no contaminar available_slots)
CREATE TABLE waitlist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id),
  binomio_id      UUID NOT NULL REFERENCES binomios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at     TIMESTAMPTZ
);
```

### Scaffolding para Fases 2-4 (crear tablas vacías — no implementar lógica)

```sql
-- FASE 2: Portal de socios
CREATE TABLE members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  member_number TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE member_debts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),
  concept     TEXT NOT NULL,  -- 'cuota' | 'pension' | 'ropero' | 'otro'
  amount_ars  INTEGER NOT NULL,
  due_date    DATE NOT NULL,
  paid_at     TIMESTAMPTZ,
  mp_payment_id TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FASE 3: Log de exportaciones al sistema legacy
CREATE TABLE export_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_date  DATE NOT NULL,
  file_name    TEXT NOT NULL,
  row_count    INTEGER NOT NULL,
  exported_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  exported_by  TEXT          -- 'cron' | 'manual'
);

-- FASE 4: Dashboard — esta tabla alimentará métricas en tiempo real
CREATE TABLE payment_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source        TEXT NOT NULL,  -- 'registration' | 'member_debt'
  source_id     UUID NOT NULL,
  amount_ars    INTEGER NOT NULL,
  mp_payment_id TEXT NOT NULL,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 2. Capa de datos (`src/lib/db/`)

Crear `src/lib/db/client.ts` con un pool singleton de `pg`:

```ts
// src/lib/db/client.ts
import { Pool } from 'pg';

let pool: Pool;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}
```

Crear `src/lib/db/queries/` con un archivo por entidad, exportando funciones tipadas. Ejemplo de patrón a seguir:

```ts
// src/lib/db/queries/registrations.ts
import { getPool } from '../client';

export async function createRegistrationWithHold(params: {
  eventId: string;
  binomioId: string;
  boxRequested: boolean;
}): Promise<{ registrationId: string } | { error: 'no_slots' | 'duplicate' }> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the row to prevent concurrent slot decrements
    const { rows } = await client.query(
      `SELECT available_slots FROM events WHERE id = $1 FOR UPDATE`,
      [params.eventId]
    );

    if (rows[0].available_slots <= 0) {
      await client.query('ROLLBACK');
      return { error: 'no_slots' };
    }

    await client.query(
      `UPDATE events SET available_slots = available_slots - 1 WHERE id = $1`,
      [params.eventId]
    );

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const { rows: reg } = await client.query(
      `INSERT INTO registrations
         (event_id, binomio_id, box_requested, status, hold_expires_at)
       VALUES ($1, $2, $3, 'pending_payment', $4)
       RETURNING id`,
      [params.eventId, params.binomioId, params.boxRequested, holdExpiresAt]
    );

    await client.query('COMMIT');
    return { registrationId: reg[0].id };
  } catch (err: unknown) {
    await client.query('ROLLBACK');
    if ((err as { code?: string }).code === '23505') return { error: 'duplicate' };
    throw err;
  } finally {
    client.release();
  }
}
```

Seguir este mismo patrón transaccional para todas las mutaciones de `available_slots`.

---

## 3. Mercado Pago (`src/lib/mercadopago.ts`)

Instalar: `npm install mercadopago`

```ts
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function createCheckoutPreference(params: {
  registrationId: string;
  eventName: string;
  competitionTitle: string;
  participantEmail: string;
  priceArs: number;      // centavos
  boxPriceArs: number;   // centavos, 0 si no reservó box
  horseName: string;
  participantName: string;
}) {
  const preference = new Preference(client);
  const items = [
    {
      id: params.registrationId,
      title: `${params.competitionTitle} — ${params.eventName}`,
      description: `Binomio: ${params.participantName} / ${params.horseName}`,
      quantity: 1,
      unit_price: params.priceArs / 100,
      currency_id: 'ARS' as const,
    },
  ];

  if (params.boxPriceArs > 0) {
    items.push({
      id: `${params.registrationId}-box`,
      title: 'Reserva de box',
      description: `Box para ${params.horseName}`,
      quantity: 1,
      unit_price: params.boxPriceArs / 100,
      currency_id: 'ARS' as const,
    });
  }

  const result = await preference.create({
    body: {
      items,
      payer: {
        name: params.participantName,
        email: params.participantEmail,
      },
      external_reference: params.registrationId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/inscripcion/gracias?id=${params.registrationId}`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/inscripcion/error?id=${params.registrationId}`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/inscripcion/pendiente?id=${params.registrationId}`,
      },
      auto_return: 'approved' as const,
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'CLUB HIPICO',
      // La comisión la paga el jinete — el club recibe el monto neto de MP
      marketplace_fee: 0,
      expires: true,
      expiration_date_to: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });

  return result;
}
```

---

## 4. API Routes (`src/app/api/`)

### Flujo público — Inscripción

#### `GET /api/competitions`
Retorna concursos con `status = 'open'`, con días y pruebas anidadas incluyendo `available_slots` actuales.

#### `GET /api/competitions/[id]`
Concurso completo: días → pruebas con slots. Incluye `box_price_ars` del concurso.

#### `POST /api/registrations`
**Flujo crítico. Body:**
```ts
{
  eventId: string;
  participantName: string;
  participantEmail: string;
  horseName: string;
  licenseNumber?: string;
  boxRequested: boolean;
}
```

**Lógica:**
1. Validar con zod.
2. Buscar o crear `binomio` por `(participantEmail, horseName)` — un email+caballo siempre es el mismo binomio.
3. Llamar a `createRegistrationWithHold()` (transaccional).
4. Si `{ error: 'no_slots' }`: verificar `waitlist_enabled`; si sí, insertar en `waitlist` y retornar `{ status: 'waitlisted' }`. Si no, retornar `409`.
5. Si `{ error: 'duplicate' }`: retornar `409 { error: 'already_registered' }`.
6. Crear Preference en MP con `createCheckoutPreference()`.
7. Guardar `mp_preference_id` en la registration.
8. Retornar `{ registrationId, checkoutUrl: result.init_point, holdsUntil }`.

#### `GET /api/registrations/[id]`
Estado actual de una inscripción (usado por el frontend para polling post-pago).
Retorna: `{ status, eventName, competitionTitle, participantName, horseName, confirmedAt }`.

### Webhook de Mercado Pago

#### `POST /api/webhooks/mercadopago`
**Única fuente de verdad para confirmar vacantes.**

```ts
// Verificar firma
const signature = request.headers.get('x-signature');
// Validar según doc oficial de MP: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

// Solo procesar topic = 'payment'
// Obtener payment.id del body
// Fetch payment details desde MP API
// Matching: payment.external_reference === registrationId

// Si payment.status === 'approved':
//   - UPDATE registrations SET status='confirmed', confirmed_at=now(), mp_payment_id=...
//   - Llamar a sendConfirmationEmail()
//   - Insertar en payment_events (scaffolding Fase 4)

// Si payment.status en ['rejected','cancelled']:
//   - UPDATE registrations SET status='cancelled'
//   - BEGIN: available_slots + 1, COMMIT
//   - Si hay waitlist: notificar primer registro con slot disponible

// Siempre retornar 200 OK — MP reintenta en non-2xx
```

### Hold expiry

#### `POST /api/admin/release-expired-holds`
Protegido con `x-admin-secret`.

```sql
-- Encontrar holds vencidos
SELECT id, event_id FROM registrations
WHERE status = 'pending_payment'
  AND hold_expires_at < now();

-- Para cada uno (en transacción):
-- UPDATE registrations SET status = 'cancelled'
-- UPDATE events SET available_slots = available_slots + 1
```

Retornar `{ released: number }`.

Agregar a `vercel.json`:
```json
{
  "crons": [{ "path": "/api/admin/release-expired-holds", "schedule": "*/5 * * * *" }]
}
```

Para desarrollo local: `setInterval` en un archivo de startup que llame al endpoint cada 5 minutos.

### Sorteo automático

#### `POST /api/admin/competitions/[id]/draw`
Protegido con `x-admin-secret`.

El sorteo se ejecuta por día + prueba. Para cada `event_id` dentro del concurso:

```ts
// 1. Obtener todas las registrations con status='confirmed' para el event_id
// 2. Mezclar aleatoriamente (Fisher-Yates shuffle)
// 3. Asignar draw_order = índice + 1
// 4. UPDATE registrations SET draw_order = $1 WHERE id = $2 (bulk update)
// 5. UPDATE events SET draw_done = true WHERE id = $event_id
// 6. Retornar el orden completo: [{ binomioName, horseName, draw_order }]
```

**Restricción:** Solo ejecutable si `competition.status = 'closed'`. Retornar `400` si se intenta con el concurso abierto.

### Deuda por binomio

#### `GET /api/competitions/[id]/debt/[binomioId]`
Calcula la deuda total de un binomio para un concurso:

```ts
// Suma de: pruebas confirmadas (price_ars) + boxes solicitados (box_price_ars del concurso)
// Solo registrations con status = 'confirmed'
// Retornar:
{
  binomioName: string;
  horseName: string;
  items: Array<{ concept: string; amountArs: number }>;
  totalArs: number;
  paid: boolean; // true si mp_payment_id existe en todas las registrations
}
```

### Rutas de administración

#### `POST /api/admin/competitions`
Crear concurso con días y pruebas anidadas en un solo request. Body tipado con zod.

#### `PATCH /api/admin/competitions/[id]`
Actualizar status del concurso (`draft → open → closed → cancelled`).

#### `POST /api/admin/competitions/[id]/days`
Agregar un día al anteprograma.

#### `POST /api/admin/days/[dayId]/events`
Agregar una prueba a un día con `price_ars`, `total_slots`, `category`.

#### `GET /api/admin/competitions/[id]/registrations`
Lista completa de inscriptos confirmados. Formato:
```ts
Array<{
  eventName: string;
  dayLabel: string;
  participantName: string;
  participantEmail: string;
  horseName: string;
  licenseNumber: string | null;
  boxRequested: boolean;
  drawOrder: number | null;
  confirmedAt: string;
}>
```

### Scaffolding — rutas placeholder para Fases 2-4

Crear los siguientes archivos con un handler que retorne `501 Not Implemented` y un comentario indicando la fase:

```
src/app/api/members/route.ts                    // FASE 2: Portal de socios
src/app/api/members/[id]/debts/route.ts         // FASE 2: Deuda de socio
src/app/api/admin/export/route.ts               // FASE 3: Export CSV/XLSX
src/app/api/admin/dashboard/route.ts            // FASE 4: Dashboard tesorería
```

---

## 5. Email — Comprobante automático (`src/lib/email.ts`)

Instalar: `npm install resend`

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(params: {
  to: string;
  participantName: string;
  horseName: string;
  competitionTitle: string;
  competitionDate: string;
  eventName: string;
  drawOrder: number | null;
  boxRequested: boolean;
  amountPaidArs: number;
  mpPaymentId: string;
}) {
  // HTML con estilos inline únicamente — sin dependencias externas
  // Incluir: nombre del concurso, fecha, prueba, binomio (jinete + caballo),
  //          número de orden de sorteo (si ya se ejecutó), box confirmado (si aplica),
  //          monto pagado, número de operación MP
  // Firma: nombre del club
  await resend.emails.send({
    from: process.env.NOTIFICATION_FROM_EMAIL!,
    to: params.to,
    subject: `✅ Inscripción confirmada — ${params.competitionTitle}`,
    html: buildConfirmationHtml(params), // función auxiliar en el mismo archivo
  });
}
```

---

## 6. Exportación legacy (`src/lib/export.ts`)

Instalar: `npm install exceljs`

```ts
// FASE 3 scaffolding — implementar solo la función, el endpoint va en Fase 3

export async function generateDailyExport(competitionId: string, date: string): Promise<Buffer> {
  // Obtener todas las registrations confirmed del día
  // Generar XLSX con ExcelJS con las columnas:
  //   Prueba | Categoría | Orden Sorteo | Jinete | Caballo | Licencia | Box | Email | Monto | ID Pago MP
  // Retornar buffer para descarga
  throw new Error('FASE 3: No implementado');
}
```

---

## 7. Frontend — Páginas

Usar siempre los tokens del tema existente. Todos los strings de usuario van al contexto i18n.

### `/concursos` — Listado público
- Grilla de concursos abiertos: título, fechas, ubicación.
- Por cada concurso, indicador visual del total de pruebas disponibles.
- Link a detalle del concurso.

### `/concursos/[id]` — Detalle y formulario de inscripción

Estructura de la página:
1. Header: título del concurso, fechas, ubicación.
2. Selector de día (tabs o segmented control con `competition_days`).
3. Por cada prueba del día:
   - Nombre, categoría, precio
   - Indicador de cupos: verde (`> 3`), ámbar (`1-3`), rojo (`agotado`)
   - Botón "Inscribirme" que expande un formulario inline

**Formulario de inscripción** (expandible por prueba):
```
Nombre completo *
Email *
Nombre del caballo *          ← campo de dominio hípico, siempre requerido
Número de licencia            ← opcional — helper: "Dejá vacío si no tenés licencia federada"
[ ] Reservar box (+$X.XXX)   ← checkbox que suma box_price_ars al total
```

Al hacer submit:
- Llamar `POST /api/registrations`
- Si OK: mostrar banner con countdown timer (`holdsUntil - now`) + botón "Ir al pago"
  - **Texto del banner:** "Tu cupo está reservado por X:XX minutos. Si no completás el pago antes, el cupo se liberará automáticamente."
  - El timer corre en tiempo real con `setInterval`
- Si `409 no_slots_available`: mostrar opción de anotarse en lista de espera
- Si `409 already_registered`: mostrar "Ya estás inscripto a esta prueba"
- Si `waitlisted`: confirmación de lista de espera

**No confirmar el cupo en el frontend.** El checkout URL es solo el link de pago — la confirmación la hace el webhook.

### `/inscripcion/gracias` — Post-pago

Recibe `?id={registrationId}` en la URL.

Comportamiento:
1. Fetch inmediato a `GET /api/registrations/[id]`
2. Si `status === 'confirmed'`: mostrar comprobante completo (concurso, prueba, binomio, fecha de pago) + botón "Imprimir"
3. Si `status === 'pending_payment'`: mostrar spinner "Esperando confirmación del pago..." y hacer polling cada 3 segundos hasta confirmar o hasta 45 segundos. Si llega a 45s sin confirmar, mostrar "Tu pago está siendo procesado. Recibirás el comprobante por email."
4. Si `status === 'cancelled'`: "El pago no fue procesado. El cupo fue liberado. [Volver a intentarlo]"

### `/inscripcion/error` y `/inscripcion/pendiente`
Páginas simples que retomn el estado del link `?id=` y redirigen a `/inscripcion/gracias` con el mismo id.

### `/admin` — Panel del club (protegido)

Protección: verificar `x-admin-secret` header o query param `?secret=` contra `process.env.ADMIN_SECRET`.

Tabs:
1. **Anteprograma** — crear/editar concursos, días y pruebas. Botón "Cerrar inscripciones" (cambia status a `closed`).
2. **Inscriptos** — filtro por concurso → día → prueba. Tabla con: orden sorteo, jinete, caballo, licencia, box, estado, fecha confirmación.
3. **Sorteo** — por prueba: botón "Ejecutar sorteo" (solo disponible si `status=closed` y `draw_done=false`). Muestra el orden resultante.
4. **Deuda** — por binomio: total a pagar, desglose de pruebas + box.
5. **Exportar** — botón "Descargar CSV del día" (client-side desde los datos ya cargados, usando `Papa.parse` inverso o construcción manual de CSV). Nota: la exportación XLSX completa al sistema legacy va en Fase 3.

---

## 8. Constraints no negociables

1. **Mutaciones de cupos siempre en transacción** con `SELECT ... FOR UPDATE` (Postgres). Nunca modificar `available_slots` fuera de una transacción.
2. **El webhook es la única fuente de verdad** para confirmar una inscripción. El frontend nunca marca `confirmed` por su cuenta.
3. **`horse_name` es requerido** en el formulario, en la DB (`NOT NULL`), en los emails y en el panel admin. Es el campo de dominio que diferencia este sistema de una solución genérica.
4. **El countdown del hold es visible al usuario** desde el momento en que recibe el `checkoutUrl`.
5. **La comisión de MP la paga el jinete** — no modificar esto, es un requisito del brief.
6. **No tocar `src/store/events.ts`** ni la data layer de localStorage existente.
7. **Todos los strings de UI en el contexto i18n** — ni una cadena hardcodeada en español en JSX.
8. **El sorteo solo se puede ejecutar con inscripciones cerradas** (`competition.status = 'closed'`).
9. **El código fuente debe quedar limpio y documentado** — el club es propietario del código (requisito del brief). Agregar JSDoc a todas las funciones de la capa `src/lib/`.

---

## 9. Orden de implementación sugerido

```
1. src/lib/db/client.ts + migrations/001_initial.sql + migrate.ts
2. src/lib/db/queries/ (un archivo por entidad: competitions, events, registrations, binomios, waitlist)
3. src/lib/mercadopago.ts
4. src/lib/email.ts
5. src/lib/export.ts (scaffolding solamente)
6. API: POST /api/registrations + POST /api/webhooks/mercadopago  ← core del MVP
7. API: GET /api/competitions + GET /api/competitions/[id] + GET /api/registrations/[id]
8. API: POST /api/admin/release-expired-holds + vercel.json cron
9. API: Admin routes (competitions CRUD, draw, registrations list)
10. API: Scaffolding 501 para Fases 2-4
11. Frontend: /concursos + /concursos/[id] (listado + formulario + countdown)
12. Frontend: /inscripcion/gracias (polling + comprobante)
13. Frontend: /admin (panel con tabs)
14. .env.example + README con instrucciones de setup y deploy
```

---

## 10. README mínimo requerido

El brief exige documentación técnica entregada al finalizar. Incluir en `README.md`:

- Setup local (clone → `.env.local` → `npm install` → `npm run db:migrate` → `npm run dev`)
- Variables de entorno y cómo obtener cada una (MP developer panel, Resend dashboard)
- Cómo configurar el webhook de MP en el panel de desarrolladores
- Cómo hacer el primer deploy en Railway o Render
- Cómo ejecutar el sorteo (flujo admin)
- Cómo generar el CSV de exportación (cuando esté en Fase 3)
- Descripción de cada fase y qué está implementado vs. scaffolded
