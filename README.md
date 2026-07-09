# Club Hípico Argentino

Sistema de concursos y socios del Club Hípico Argentino: inscripción a pruebas con pago online (Mercado Pago), sorteo, cálculo de deuda por binomio, portal de socios con cobro de cuotas/pensiones/roperos, exportación diaria al sistema legado del club, dashboard de tesorería y un panel de administración.

**New here? Start with:** este README para el setup, [`docs/architecture.md`](./docs/architecture.md) para cómo está construido, [`docs/fase1-setup.md`](./docs/fase1-setup.md) y [`docs/fase2-4-setup.md`](./docs/fase2-4-setup.md) para el detalle de cada fase, y [`planning.md`](./planning.md) para el gap analysis original y el brief del cliente ([`Brief_Tecnico_Sistema_Equitacion.docx`](./docs/Brief_Tecnico_Sistema_Equitacion.docx)).

## Features

- **Concursos** (`/concursos`): listado público de concursos abiertos, anteprograma por día/prueba, inscripción inline con reserva de box y countdown de pago.
- **Inscripción y pago** (`/inscripcion/*`): hold de 15 minutos sobre el cupo mientras se completa el pago vía Mercado Pago Checkout Pro; el webhook de Mercado Pago es la única fuente de verdad que confirma una inscripción (nunca el frontend); comprobante automático por email vía Resend.
- **Portal de socios** (`/socios/[id]`): link permanente por socio con desglose de deuda (cuota, pensión, ropero, otro) y pago online por ítem.
- **Panel de administración** (`/admin`, protegido por `ADMIN_SECRET`): Anteprograma (crear/editar concursos, días y pruebas), Inscriptos, Sorteo (Fisher-Yates, solo con inscripciones cerradas), Deuda por binomio, Socios (alta y carga de deudas), Dashboard de tesorería, y Exportar (CSV de inscriptos + XLSX diario para el sistema legado del club).

**Estado:** Fases 1-4 completas. Detalle de qué se pudo probar de punta a punta (y qué no, por falta de credenciales reales de Mercado Pago/Resend) en [`docs/fase1-setup.md`](./docs/fase1-setup.md) y [`docs/fase2-4-setup.md`](./docs/fase2-4-setup.md). Las notificaciones por WhatsApp (ítem opcional de Fase 4) quedaron fuera de alcance.

## Setup local

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

Otros scripts:

```bash
npm run build   # build de producción
npm run start   # corre el build de producción en local
npm run lint    # eslint
```

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · PostgreSQL (`pg`, sin ORM) · Mercado Pago Checkout Pro · Resend · zod · ExcelJS · date-fns · lucide-react

i18n y manejo de estado del lado del cliente son implementaciones propias, pequeñas y a medida (`src/i18n/`, no una librería externa). Detalle y justificación en [`docs/architecture.md`](./docs/architecture.md).

## Deploy a producción

Ver [`DEPLOY.md`](./DEPLOY.md) (Vercel).

> **⚠️ Seguridad:** el panel `/admin` está protegido por un secreto compartido simple (`ADMIN_SECRET`), no por un sistema de usuarios real — ver `docs/fase1-setup.md` antes de exponerlo públicamente. El portal de socios y la consulta de deuda usan el UUID del registro como credencial implícita (no hay login de socio) — ver `docs/fase2-4-setup.md`.
