# Deploy a Vercel

Guía paso a paso para el primer deploy en producción. Asume que ya tenés el proyecto andando en local — ver [`README.md`](./README.md) y [`docs/fase1-setup.md`](./docs/fase1-setup.md) para el setup local y de dónde sacar cada credencial.

## 1. Prerrequisitos

- Cuenta de Vercel con el repo de GitHub conectado (o importado directamente).
- Una base de datos Postgres alcanzable desde internet (Vercel no incluye Postgres por defecto). Cualquiera de estas sirve, ya que la app usa el driver `pg` puro sin ORM, sin lock-in a un proveedor:
  - **Vercel Postgres** (Neon) — pestaña "Storage" del proyecto en Vercel, la opción más integrada.
  - Supabase, Railway, Neon (standalone) o Render Postgres — cualquiera funciona igual.
- Credenciales reales de Mercado Pago (modo test primero) y Resend — ver la tabla de la sección 3 de [`docs/fase1-setup.md`](./docs/fase1-setup.md#3-variables-de-entorno) para dónde conseguir cada una.

## 2. Crear el proyecto en Vercel

1. [vercel.com/new](https://vercel.com/new) → importar el repo. Vercel detecta Next.js automáticamente — no hace falta tocar el build command (`next build`) ni el root directory.
2. Elegir la rama de producción: por el gitflow de este repo (ver [`docs/workflow.md`](./docs/workflow.md)), **`main`** debe ser la rama de producción de Vercel (Settings → Git → Production Branch). Las demás ramas (`develop`, `feature/*`) generan preview deployments automáticamente — no van a producción.

## 3. Variables de entorno

En el proyecto de Vercel → Settings → Environment Variables, cargar todas las que están en [`.env.example`](./.env.example):

| Variable | Valor en producción |
|---|---|
| `DATABASE_URL` | Connection string del Postgres elegido en el paso 1. Ver nota de SSL en la sección 6. |
| `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY` | Credenciales de Mercado Pago (empezar con las de test, pasar a producción cuando esté probado). |
| `MP_WEBHOOK_SECRET` | Ver sección 5. |
| `NEXT_PUBLIC_BASE_URL` | La URL pública del deploy (el dominio de Vercel, o tu dominio propio — ver sección 7). Sin `/` al final. |
| `ADMIN_SECRET` | Un secreto elegido por vos — protege `/admin` y `/api/admin/*`. |
| `CRON_SECRET` | **Obligatoria en Vercel** (no aplica en local). Vercel la inyecta automáticamente como `Authorization: Bearer <CRON_SECRET>` al invocar el cron — alcanza con definirla acá como variable de entorno normal. |
| `RESEND_API_KEY` | Dashboard de Resend → API Keys. |
| `NOTIFICATION_FROM_EMAIL` | Remitente verificado en Resend. |

Marcar todas como disponibles para el ambiente **Production** (y **Preview** también, si querés que los preview deployments puedan probar el flujo completo contra la misma base o una de staging).

## 4. Migrar la base de datos de producción

La migración (`npm run db:migrate`) es idempotente — corre una sola vez por archivo de migración, registrado en la tabla `schema_migrations`, así que es seguro volver a correrla. **Correrla una vez antes del primer deploy**, apuntando `DATABASE_URL` a la base de producción:

```bash
DATABASE_URL="<connection-string-de-producción>" npx tsx src/lib/db/migrate.ts
```

Corré esto desde tu máquina local (no hace falta que sea parte del build de Vercel). Repetirlo en cada deploy futuro que agregue una migración nueva (`src/lib/db/migrations/00N_*.sql`).

No correr `npm run db:seed` contra producción — ese script inserta un concurso de prueba pensado solo para desarrollo local.

## 5. Configurar el webhook de Mercado Pago

1. Panel de desarrolladores de Mercado Pago → tu aplicación → "Webhooks" → "Configurar notificación".
2. URL de notificación: `https://<tu-dominio>/api/webhooks/mercadopago`.
3. Copiar la clave secreta que te da esa pantalla a la variable `MP_WEBHOOK_SECRET` (paso 3).
4. Esto solo se puede probar de punta a punta ya en producción (o en el ambiente de test de Mercado Pago) — ver la sección 5 de [`docs/fase1-setup.md`](./docs/fase1-setup.md#5-qué-se-pudo-probar-en-este-entorno-y-qué-no) para qué quedó sin probar contra un webhook real.

## 6. Vercel Cron Jobs

`vercel.json` ya tiene configurado el cron de liberación de holds vencidos:

```json
{ "crons": [{ "path": "/api/admin/release-expired-holds", "schedule": "*/5 * * * *" }] }
```

No requiere ninguna acción adicional más allá de tener `CRON_SECRET` seteada (paso 3) — Vercel lo detecta automáticamente al desplegar. Verificar en el dashboard (Settings → Cron Jobs) que aparezca activo, y que el plan de Vercel que estés usando permita la frecuencia configurada (los límites de cron varían según el plan — revisar en el dashboard si el cron no corre como se espera).

**Nota sobre SSL de Postgres:** la mayoría de los proveedores hosteados (Supabase, Neon, Railway, Vercel Postgres) requieren SSL. Si `DATABASE_URL` no incluye `?sslmode=require` y ves un error de conexión al hacer el primer request después de deployar, agregalo a la connection string. Si en cambio ves un error de certificado (`self signed certificate in certificate chain`), puede hacer falta pasar `ssl: { rejectUnauthorized: false }` al `new Pool(...)` en `src/lib/db/client.ts` — común con estos proveedores, pero no está seteado por defecto en este repo porque no hizo falta contra Postgres local.

## 7. Dominio propio (opcional)

Si vas a usar un dominio propio en vez del `*.vercel.app` que asigna Vercel: Settings → Domains → agregar el dominio y seguir las instrucciones de DNS. Una vez confirmado, actualizar `NEXT_PUBLIC_BASE_URL` (paso 3) y la URL del webhook de Mercado Pago (paso 5) para que apunten al dominio final, no al `*.vercel.app` temporal.

## 8. Checklist post-deploy

- [ ] `GET https://<tu-dominio>/api/competitions` responde `200` con un array (vacío si todavía no cargaste ningún concurso).
- [ ] `/admin` pide la clave y, con `ADMIN_SECRET` correcto, entra al panel.
- [ ] Vercel → Cron Jobs muestra el cron de `release-expired-holds` activo.
- [ ] Crear un concurso de prueba desde `/admin` → Anteprograma, e inscribirse desde `/concursos` — confirmar que se genera un `checkoutUrl` real de Mercado Pago (no el error de "no se pudo generar el link de pago" que se veía en desarrollo sin credenciales).
- [ ] Completar un pago de prueba en el ambiente de test de Mercado Pago y confirmar que el webhook marca la inscripción como `confirmed` y llega el email de Resend.
