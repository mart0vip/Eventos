# Fases 2-4 — Guía de setup: Portal de Socios, Exportación y Dashboard

Continuación de [`docs/fase1-setup.md`](./fase1-setup.md) — asume Fase 1 ya andando (Postgres local, `.env.local` completo). No hay variables de entorno nuevas: las tres fases reutilizan `DATABASE_URL`, `ADMIN_SECRET`, las credenciales de Mercado Pago y Resend de Fase 1.

## 1. Migración

```bash
npm run db:migrate   # aplica 002_fase2_socios.sql (idempotente)
```

La migración no crea tablas nuevas (ya estaban scaffoldeadas en `001_initial.sql`): agrega `mp_preference_id` a `member_debts`, índices, y unicidad de `mp_payment_id` en `payment_events` para que los reintentos del webhook no dupliquen el ledger.

## 2. Fase 2 — Portal de socios

Flujo completo:

1. **Alta de socio (admin):** `/admin` → tab "Socios" → "Alta de Socio" (nombre, email, n.º de socio). Email y número son únicos.
2. **Carga de deudas (admin):** mismo tab → "Cargar Deuda": concepto (`cuota` | `pension` | `ropero` | `otro`), monto en ARS y vencimiento. La API (`POST /api/members/[id]/debts`) acepta varias deudas en un solo request transaccional.
3. **Link permanente:** botón "Copiar link del portal" en la tabla de socios → `https://<dominio>/socios/<uuid>`. Se le envía al socio una sola vez; no hay login. La postura de acceso es la misma que la consulta de deuda de Fase 1: el UUID no enumerable es la credencial. **No indexar ni publicar estos links.**
4. **Pago:** el socio ve su desglose y paga cada ítem con "Pagar" → Checkout Pro. El webhook (`external_reference = member_debt:<debtId>`) marca `paid_at`, registra el pago en `payment_events` y envía el comprobante por email vía Resend. El frontend nunca marca nada como pagado (polling de cortesía al volver de MP con `?pago=exito`).

Un pago rechazado/cancelado no requiere acción: a diferencia de las inscripciones no hay cupo retenido — la deuda queda pendiente y el socio puede reintentar.

## 3. Fase 3 — Exportación al sistema legado

- `/admin` → tab "Exportar" → elegir concurso y fecha del día → "Descargar XLSX del día".
- Endpoint: `GET /api/admin/export?competitionId=<uuid>&date=YYYY-MM-DD` (gate `x-admin-secret`). Devuelve 404 `no_rows` si el día no tiene inscriptos confirmados.
- Columnas (según spec): `Prueba | Categoría | Orden Sorteo | Jinete | Caballo | Licencia | Box | Email | Monto | ID Pago MP`. El monto va en pesos (no centavos).
- Cada generación queda registrada en `export_logs` (fecha, archivo, filas, `manual`).

**Pendiente con el club:** validar los nombres exactos de columna contra el asistente de importación del sistema desktop (FoxPro/Access). Están centralizados en `sheet.columns` de [`src/lib/export.ts`](../src/lib/export.ts). El envío automático por cron al final del día (ítem opcional del plan) no se implementó; el valor `'cron'` de `export_logs.exported_by` queda reservado para eso.

## 4. Fase 4 — Dashboard de tesorería

- `/admin` → tab "Dashboard": total cobrado (desglosado por inscripciones y socios), deuda pendiente de socios, cantidad de pagos y últimos 20 pagos con pagador resuelto.
- La fuente es el ledger `payment_events`, que el webhook alimenta con cada pago aprobado. **Los pagos confirmados antes de este cambio no están en el ledger** (Fase 1 no lo escribía) — el dashboard cuenta desde el deploy de esta versión en adelante.
- Las notificaciones por WhatsApp (ítem opcional de Fase 4 en el planning) quedaron fuera de alcance.

## 5. Qué se probó en este entorno y qué no

Verificado de punta a punta contra Postgres local (y Mercado Pago en modo test para la creación de preferencias):

- Migración 002 idempotente; alta de socio (incl. duplicados 409 y validación 400); carga transaccional de deudas; portal público con desglose y total pendiente; gates de `x-admin-secret` en todas las rutas admin y en la lista de socios.
- `POST /api/members/debts/[id]/pay` creó una Preference real contra Mercado Pago (credenciales de test) y devolvió el `checkoutUrl`; deuda ya pagada → 409, inexistente → 404.
- Confirmación del webhook simulada vía `psql` (como en Fase 1): el portal refleja el pago, el dashboard suma el monto y lista el pago con su pagador.
- Export XLSX: archivo válido (verificado descomprimiendo el .xlsx), columnas y datos correctos, registro en `export_logs`, 404 para días sin confirmados.
- Panel `/admin` completo con los tabs nuevos (Socios, Dashboard) recorrido en navegador sin errores de consola.

No probado en vivo (igual que en Fase 1):

- Una notificación de webhook real firmada por Mercado Pago para un pago de socio (el ruteo por prefijo `member_debt:` está cubierto por el mismo mecanismo de firma ya verificado en Fase 1).
- El envío real del comprobante de socio vía Resend.

Antes de producción: probar un pago de deuda de socio completo en el ambiente de test de Mercado Pago con el webhook apuntando a una URL pública.
