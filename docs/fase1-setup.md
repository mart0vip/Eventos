# Fase 1 — Guía de setup: Sistema de Concursos

Guía paso a paso para levantar, configurar y entender los límites de la Fase 1 del sistema de concursos (`/concursos`, `/admin`), construida a partir de la especificación en [`docs/claude_code_prompt_equestrian_v2.md`](./claude_code_prompt_equestrian_v2.md). Este documento asume que ya tenés el resto del proyecto andando (ver el [`README.md`](../README.md) principal).

## 1. Requisitos

- Docker (para Postgres local vía `docker-compose.yml`)
- Node.js (la versión que ya usás para el resto del proyecto)

## 2. Setup local paso a paso

```bash
git clone <este-repo>
cd Eventos
npm install

cp .env.example .env.local
# completar .env.local (ver sección 3)

docker compose up -d          # Postgres local en el puerto 5433
npm run db:migrate            # crea las tablas (idempotente, se puede correr de nuevo)
npm run db:seed               # opcional: crea un concurso de prueba con cupos chicos

npm run dev                   # http://localhost:3000
```

Para probar el vencimiento automático de holds sin depender del cron de producción, corré en otra terminal:

```bash
npm run dev:cron
```

## 3. Variables de entorno

Todas están documentadas con comentarios en [`.env.example`](../.env.example). Detalle de dónde conseguir cada una:

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | Local: `postgresql://eventos:eventos_dev@localhost:5433/eventos` (ya armado por `docker-compose.yml`). Producción: la connection string de tu proveedor (Railway, Supabase, etc.). |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` | Panel de desarrolladores de Mercado Pago → "Tus integraciones" → credenciales de la aplicación (usar credenciales de test mientras no esté en producción). |
| `MP_WEBHOOK_SECRET` | Mismo panel → "Tus integraciones" → Webhooks → "Configurar notificación" → clave secreta de la aplicación. |
| `ADMIN_SECRET` | Inventada por vos — es el secreto compartido que protege `/admin` y las rutas `/api/admin/*`. |
| `CRON_SECRET` | Solo producción (Vercel). Vercel Cron Jobs invoca `/api/admin/release-expired-holds` vía GET con `Authorization: Bearer <CRON_SECRET>` — configurarla como env var en Vercel. No hace falta en local (ahí se usa `npm run dev:cron` + `ADMIN_SECRET`). |
| `RESEND_API_KEY` | Dashboard de Resend → API Keys. |
| `NOTIFICATION_FROM_EMAIL` | Un remitente verificado en Resend (dominio propio verificado, o el de pruebas que da Resend). |
| `NEXT_PUBLIC_BASE_URL` | Local: `http://localhost:3000`. Producción: la URL pública real (Mercado Pago necesita poder llegar a `NEXT_PUBLIC_BASE_URL/api/webhooks/mercadopago`, así que en local el webhook real de MP **no puede llegar** — ver sección 5). |

## 4. Configurar el webhook de Mercado Pago

1. En el panel de desarrolladores de MP, ir a "Tus integraciones" → tu aplicación → "Webhooks".
2. Configurar la URL de notificación: `https://<tu-dominio-de-producción>/api/webhooks/mercadopago`.
3. Copiar la "clave secreta" que te da esa pantalla a `MP_WEBHOOK_SECRET`.
4. Mercado Pago firma cada notificación (header `x-signature`) — la verificación usa el `WebhookSignatureValidator` que trae el propio SDK de Mercado Pago (`src/lib/mercadopago.ts`), no una implementación propia.

## 5. Qué se pudo probar en este entorno y qué no

Este build se hizo sin credenciales reales de Mercado Pago ni Resend. Lo que sí se verificó de punta a punta contra Postgres local:

- Migración (con idempotencia), holds transaccionales, rechazo de duplicados, liberación de holds vencidos, lista de espera.
- Los 16 endpoints de `/api/*` (públicos y de admin), incluyendo el gate de `x-admin-secret` y el estado `draft→open→closed→cancelled`.
- El flujo completo de `/concursos` → inscripción inline → banner de countdown → `/inscripcion/gracias` (simulando la confirmación del webhook a mano vía `psql`).
- El panel `/admin` completo: crear concurso, agregar días/pruebas, abrir/cerrar inscripciones, sorteo (bloqueado si no está cerrado), cálculo de deuda, export CSV — recorrido con Playwright, sin errores de consola.

Lo que **no** se pudo probar en vivo (sin credenciales reales):

- La creación real de una `Preference` de Mercado Pago y el pago de punta a punta (el endpoint `POST /api/registrations` deja el cupo reservado igual, y devuelve un error de "no se pudo generar el link de pago" — comportamiento esperado, no un bug).
- Una notificación de webhook realmente firmada por Mercado Pago (se probó el mecanismo de verificación de firma con un payload firmado a mano usando el mismo algoritmo, pero no un payload real de MP).
- El envío real de un email vía Resend.

Antes de ir a producción con esto: conseguir credenciales reales de MP (modo test primero) y de Resend, y probar el flujo de pago completo al menos una vez en el ambiente de test de Mercado Pago.

## 6. Cómo correr el sorteo

1. Desde `/admin` → pestaña "Anteprograma", cerrar las inscripciones del concurso (botón "Cerrar Inscripciones" — solo disponible si está `open`).
2. Ir a la pestaña "Sorteo", elegir el concurso.
3. "Ejecutar Sorteo" — corre el sorteo (Fisher-Yates) para cada prueba que todavía no tenga sorteo hecho. Si volvés a ejecutar después de agregar una prueba nueva, solo sortea la nueva (las que ya tienen `draw_done=true` no se vuelven a sortear).

## 7. Exportación

- **CSV (Fase 1, ya funciona):** pestaña "Exportar" del panel admin, botón "Descargar CSV" — reutiliza la utilidad existente `src/lib/csv.ts` (mismo formato UTF-8 con BOM que ya usa `/club`).
- **XLSX en el formato del sistema legado del club (Fase 3):** todavía no implementado — `src/lib/export.ts` tiene solo el esqueleto de la función (`generateDailyExport`), documentado con las columnas esperadas.

## 8. Primer deploy (Railway o Render)

1. Crear un servicio Postgres (Railway o Render) y copiar su `DATABASE_URL` a las variables de entorno del deploy.
2. Configurar el resto de las variables de la sección 3 (con credenciales reales de MP/Resend).
3. Correr `npm run db:migrate` contra la base de producción (una vez, antes del primer deploy o como parte del build step).
4. Si el deploy es en Vercel: `vercel.json` ya tiene el cron configurado para `/api/admin/release-expired-holds` cada 5 minutos — solo falta setear `CRON_SECRET` como variable de entorno del proyecto.
5. Configurar el webhook de Mercado Pago apuntando a la URL pública real (sección 4).
