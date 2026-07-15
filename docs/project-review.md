# Revisión del proyecto — julio 2026

Revisión de código y documentación del sistema completo (Fases 1-4), hecha sobre `development` post-release v0.3.0. Todos los hallazgos con impacto en runtime fueron **verificados empíricamente** contra el stack local (Postgres vía Docker, `next dev`, credenciales de test de Mercado Pago); el detalle de cada verificación está en [`docs/user-journeys.md`](./user-journeys.md).

**Estado general: bueno.** La arquitectura declarada en `docs/architecture.md` coincide con el código casi en su totalidad, los patrones de idempotencia y transaccionalidad están bien aplicados en la capa de datos, y la suite de tests (285 tests, cobertura ≥80% con gate en CI) cubre lo que dice cubrir. Los hallazgos de abajo están ordenados por prioridad.

## Hallazgos

### Alta prioridad

#### 1. La ventana anti-replay del webhook rechazaría notificaciones reales de Mercado Pago (unidad de `ts`)

`src/lib/mercadopago.ts` pasa `toleranceSeconds: 300` al `WebhookSignatureValidator` del SDK oficial (`mercadopago` v3.2.0). El validador interpreta el `ts` del header `x-signature` como **milisegundos** (`driftSeconds = |Date.now() − Number(ts)| / 1000`, ver `node_modules/mercadopago/dist/utils/webhook/index.js`). La documentación de Mercado Pago especifica `ts` como Unix timestamp en **segundos**.

Reproducido en local con una notificación **firmada válidamente** (HMAC correcto con el secret real):

- `ts` en segundos → rechazada con `TimestampOutOfTolerance`.
- `ts` en milisegundos → aceptada.

Si Mercado Pago envía `ts` en segundos (como indica su doc pública), **ningún webhook real pasaría la verificación en producción** → ningún pago se confirmaría nunca, ni inscripciones ni deudas de socios. Los tests del repo generan `ts` con `Date.now()` (ms), por eso pasan en verde sin detectar esto.

La verificación de la firma en sí no depende de la unidad (el manifest usa el string tal cual llega); solo la ventana anti-replay tiene el supuesto de unidad.

**Acción recomendada:** confirmar la unidad con una notificación real de MP (ya listado como pendiente en `docs/fase1-setup.md` §5 — esto lo vuelve bloqueante, no opcional). Si es segundos: llamar al validador **sin** `toleranceSeconds` y hacer el chequeo de tolerancia del lado de la app tratando `ts` como segundos (no se puede "normalizar" el header: `ts` es parte del manifest firmado).

#### 2. La rama de inscripciones del webhook no es completamente idempotente y puede confirmar registraciones canceladas

En `src/app/api/webhooks/mercadopago/route.ts`, la rama `member_debt` está correctamente guardada por el retorno de `markDebtPaid` (primera confirmación → ledger + email; retry → no-op). La rama de inscripciones **no tiene guard equivalente**:

- **Email duplicado en retries:** un retry del webhook para el mismo pago aprobado vuelve a ejecutar `confirmRegistration` y `sendConfirmationReceipt` — el ledger dedupea por `mp_payment_id`, pero el comprobante por email se reenvía. Contradice lo que `docs/architecture.md` declara como invariante ("a retried webhook call is always safe to re-run … or a retry will double-count a payment or double-send an email").
- **Confirmación de una registración cancelada, sin cupo:** `confirmRegistration` (`src/lib/db/queries/registrations.ts`) hace `UPDATE … WHERE id = $1` sin guard de estado. Un pago aprobado que llega **después** de que el cron canceló el hold (pago iniciado justo antes del vencimiento de 15 min) marca `confirmed` una registración `cancelled` cuyo cupo ya fue devuelto → sobreventa de 1 lugar en esa prueba. La expiración de la preferencia (15 min) lo mitiga pero no lo elimina.

**Acción recomendada:** replicar el patrón de `markDebtPaid`: `UPDATE … SET status='confirmed' … WHERE id=$1 AND status='pending_payment' RETURNING id`, y usar el resultado como guard de primera confirmación (ledger + email solo si confirmó). Qué hacer con un pago aprobado post-cancelación (retomar cupo si hay, o marcar para reembolso manual) es una decisión de negocio a definir con el club.

### Prioridad media

#### 3. La liberación de holds por cron no notifica la lista de espera (doc dice que sí)

`docs/architecture.md` (§"Registration & payment flow", punto 3) afirma que `releaseExpiredHolds` "releases any hold … **and notifies the next waitlisted binomio**". El código no lo hace: solo la rama `rejected`/`cancelled` del webhook llama a `notifyNextWaitlisted`; el cron (`releaseExpiredHolds`) cancela y devuelve cupo sin tocar la waitlist.

Verificado empíricamente: hold vencido sobre una prueba llena con lista de espera → cupo devuelto, entrada de waitlist quedó con `notified_at = NULL`.

**Acción recomendada:** decidir e igualar: o el cron también notifica (probablemente lo esperado — la vía más común de liberación de cupo es el hold vencido, no el pago rechazado), o corregir el doc. Nota relacionada: "notificar" hoy es solo marcar `notified_at` (no hay email de waitlist — limitación conocida y documentada).

#### 4. El CI de push apunta a `develop`, pero la rama real es `development`

`.github/workflows/ci.yml` dispara `push` sobre `[main, develop]` y `docs/workflow.md` documenta la rama como `develop`; la rama de integración real del repo es `development`. El CI de `pull_request` cubre los PRs, pero los push directos a `development` (p. ej. el merge de sincronización post-release) no corren CI.

**Acción recomendada:** alinear (renombrar la rama a `develop`, o actualizar trigger + doc a `development`).

#### 5. La lista de espera admite entradas duplicadas

`waitlist` no tiene índice único sobre `(event_id, binomio_id)` y `addToWaitlist` no pre-chequea: el mismo binomio reintentando contra una prueba llena crea una entrada nueva por intento y ocupa varias posiciones FIFO.

**Acción recomendada:** índice único parcial (sobre entradas no notificadas) + manejo de 23505, mismo patrón que `registrations`.

### Prioridad baja / documentación

6. **`docs/fase1-setup.md` §7 quedó viejo:** dice que el XLSX del sistema legado "todavía no implementado" — Fase 3 lo implementó (`src/lib/export.ts`, documentado en `docs/fase2-4-setup.md` §3). Misma sección §5: "los 16 endpoints" — hoy son 18 route handlers.
7. **Doc-comment obsoleto en `src/lib/adminSecret.ts`:** referencia `src/store/events.ts`, parte de la demo retirada que ya no existe en el repo.
8. **Tabla de rutas de `docs/architecture.md` imprecisa:** la fila `/api/members…` marca las tres rutas como "Public-by-design", pero `GET`/`POST /api/members` están (correctamente) gateadas por admin — solo `GET /api/members/[id]/debts` y `POST /api/members/debts/[debtId]/pay` son públicas.
9. **`CLAUDE.md` incompleto:** "Qué es este repo" dice "TO DO" y "Desarrollo local" está vacío.
10. **UI:** `/inscripcion/gracias` muestra "Confirmado el `2026-07-14T18:19:54.719Z`" — timestamp ISO crudo sin formatear (el resto de la app formatea fechas con date-fns + locale).
11. **Ledger con monto 0 posible:** el webhook registra `transaction_amount ?? 0` — si MP no devolviera el monto, queda un pago de $0 en `payment_events`. Preferible loguear y omitir (o rechazar) antes que asentar $0.
12. **Constante de 15 minutos duplicada:** el TTL del hold (`registrations.ts`) y la expiración de la preferencia de MP (`mercadopago.ts`) son dos literales independientes que deben moverse juntos.

### Limitaciones conocidas (ya documentadas — se re-verificaron, sin sorpresas)

- Un único secreto compartido para `/admin` (sin usuarios ni audit trail); se acepta también por `?secret=` en query string, que queda en historial del navegador y logs de servidor.
- UUID no enumerable como única credencial del portal de socios y la consulta de deuda.
- Nombres de columna del XLSX sin validar contra el import del sistema desktop del club.
- Waitlist sin email de notificación; WhatsApp fuera de alcance.
- El dashboard cuenta desde el deploy de Fases 2-4 (los pagos previos no están en el ledger).

## Fortalezas confirmadas

- **El webhook como única fuente de verdad** está aplicado de forma consistente: el frontend nunca confirma nada; `gracias` y el portal de socios solo hacen polling.
- **Concurrencia bien resuelta en la capa de datos:** `SELECT … FOR UPDATE` para el cupo, índice único parcial como red de seguridad de duplicados, transacciones con rollback en todos los multi-paso.
- **Contrato siempre-200 del webhook** implementado como lo pide MP (firma inválida → 200 sin efectos; error interno → 200 + log).
- **Máquina de estados de concursos** con transiciones legales explícitas y el sorteo bloqueado hasta `closed`, verificado en API (no solo en UI, como sugiere el doc).
- **Suite de tests real:** 285 tests, integración contra Postgres real, HMAC real para la firma del webhook, gate de cobertura ≥80% en CI.
- **Docs honestas por fase** con "qué se probó y qué no" explícito — este review confirmó esa lista y la extendió (ver hallazgo 1).
