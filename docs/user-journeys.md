# Recorridos de usuario (user journeys) — por rol

Documenta los recorridos completos de cada rol del sistema y el resultado de **probarlos de punta a punta** contra el stack local el 2026-07-14 (branch `development`, post v0.3.0).

**Entorno de la verificación:** Postgres local (`docker compose up -d`) + `npm run db:migrate` + `npm run dev`, con credenciales de **test** de Mercado Pago (las preferencias de Checkout Pro creadas son reales). Igual que en `docs/fase1-setup.md` §5 y `docs/fase2-4-setup.md` §5, la confirmación del webhook se simuló vía `psql` (el webhook real consulta el pago contra la API de MP, y no existe un pago real sin completar un checkout); la verificación de firma del webhook sí se probó en vivo con payloads firmados a mano con el secret real. Páginas verificadas en navegador real (Playwright/Chromium). Los datos creados por este recorrido quedaron en la base de dev (`Concurso Journey Test`, socio `SOC-9001`, pagos `SIM-JOURNEY-*`).

Leyenda: ✅ verificado en este recorrido · 🧪 cubierto por la suite de tests (no repetido a mano) · ⛔ no automatizable en local (requiere completar un pago real en MP).

## Roles del sistema

| Rol | Quién es | Superficie |
|---|---|---|
| **Jinete** (visitante público) | Rider que se inscribe a pruebas de un concurso | `/`, `/concursos`, `/concursos/[id]`, `/inscripcion/*` |
| **Socio** | Miembro del club con deudas (cuota, pensión, ropero, otro) | `/socios/[id]` (link permanente, sin login) |
| **Administración** (secretaría/tesorería) | Personal del club con el `ADMIN_SECRET` | `/admin` (7 tabs) y `/api/admin/*` |
| **Sistema** | Actores automáticos: webhook de Mercado Pago y cron de holds | `/api/webhooks/mercadopago`, `/api/admin/release-expired-holds` |

---

## J1 — Jinete: descubrir un concurso, inscribirse y pagar

1. ✅ Entra a `/` → redirección 307 a `/concursos`.
2. ✅ `/concursos` lista solo concursos `open` (un concurso `draft` recién creado no aparece; al abrirlo, sí).
3. ✅ `/concursos/[id]`: anteprograma por día con sus pruebas, precio, cupos y formulario de inscripción inline (nombre, email, caballo, licencia opcional, checkbox de box).
4. ✅ Envía el formulario → `POST /api/registrations` crea el binomio (deduplicado por email+caballo), reserva el cupo con un hold de 15 min y devuelve un `checkoutUrl` **real** de Mercado Pago Checkout Pro (verificado con credenciales de test; el cupo baja de 10 a 9 al instante). La UI muestra el banner de countdown.
5. ⛔ Completa el pago en Mercado Pago (requiere una cuenta de test compradora; no automatizable acá).
6. ✅ Vuelve a `/inscripcion/gracias?id=<registrationId>` → la página pollea el estado cada 3 s (hasta 45 s). Mientras el pago no se confirma muestra "esperando"; los estados `cancelled`/timeout tienen sus propias pantallas (🧪).
7. ✅ El webhook de MP confirma la inscripción (simulado vía `psql`: `status='confirmed'` + `payment_events`) → la página pasa a **"¡Inscripción Confirmada!"** con concurso, prueba, binomio y botón imprimir. El comprobante por email (Resend) sale del webhook (🧪 con SDK mockeado; envío real no probado — sin credencial real).

Variantes verificadas:

- ✅ Mismo binomio + misma prueba de nuevo → `409 already_registered` (no consume cupo).
- ✅ Prueba sin cupo → `{"status":"waitlisted"}` con entrada FIFO en la lista de espera.
- ✅ Hold vencido liberado por el cron → el binomio puede reinscribirse (el índice único es parcial, solo sobre no-canceladas).
- ✅ Registración inexistente → 404.
- 🧪 `/inscripcion/error` y `/inscripcion/pendiente` (back_urls de MP para pago fallido/pendiente).

## J2 — Socio: ver su deuda y pagarla online

Precondición (la hace Administración, ver J3): alta del socio + carga de deudas + envío del link permanente `https://<dominio>/socios/<uuid>`.

1. ✅ Abre su link permanente `/socios/[id]` (sin login; el UUID es la credencial) → ve encabezado con nombre y n.º de socio, **total pendiente** y el desglose por ítem (concepto, vencimiento, monto, estado).
2. ✅ Toca **Pagar** en un ítem pendiente → `POST /api/members/debts/[debtId]/pay` crea una preferencia **real** de Checkout Pro y redirige a MP.
3. ⛔ Completa el pago en Mercado Pago.
4. ✅ Vuelve a `/socios/[id]?pago=exito` → banner verde "¡Pago recibido!…" y polling de cortesía cada 3 s.
5. ✅ El webhook (external_reference `member_debt:<debtId>`, simulado vía `psql`) marca la deuda pagada y la asienta en el ledger → el ítem pasa a **Pagado**, el total pendiente baja (verificado: quedó solo el ítem restante), y sale el comprobante por email (🧪).

Variantes verificadas:

- ✅ Intentar pagar una deuda ya pagada → `409 already_paid` (y el botón Pagar ya no se muestra).
- ✅ UUID de socio inexistente → 404 en la API y pantalla "no encontrado" en el portal (🧪).
- ✅ Un pago rechazado no requiere acción: la deuda queda pendiente y se puede reintentar (no hay cupo retenido).

## J3 — Administración: operar un concurso completo y gestionar socios

Login: ✅ `/admin` pide el secret (o lo toma de `?secret=` / sessionStorage); secret incorrecto → error de login, y toda `/api/admin/*` responde `401` sin secret o con secret inválido.

**Ciclo de vida de un concurso** (tab Anteprograma → Sorteo → Exportar):

1. ✅ Crear concurso (título, fechas, sede, precio de box) con días y pruebas (nombre, categoría, precio, cupos) → nace `draft`, invisible al público.
2. ✅ Abrir inscripciones (`draft→open`) → aparece en `/concursos`. Transiciones ilegales rechazadas (`open→draft` → `400 illegal_transition`).
3. ✅ Tab **Inscriptos**: lista los confirmados con binomio, prueba, box, orden de sorteo y export CSV (🧪 el CSV).
4. ✅ Cerrar inscripciones (`open→closed`). Intentar el sorteo con el concurso todavía `open` → `400 competition_not_closed` (gate también en API, no solo en UI).
5. ✅ Tab **Sorteo**: ejecuta Fisher-Yates por prueba sobre los confirmados → `draw_order` asignado 1..n; pruebas ya sorteadas no se re-sortean (🧪).
6. ✅ Tab **Deuda**: deuda por binomio (pruebas + box) — verificada también por API pública: ítems y total correctos, `paid` según `mp_payment_id`.
7. ✅ Tab **Exportar**: XLSX del día para el sistema legado — archivo válido con las columnas de la spec (`Prueba | Categoría | Orden Sorteo | Jinete | Caballo | Licencia | Box | Email | Monto | ID Pago MP`), monto en pesos, y registro en `export_logs` (`manual`). Día sin confirmados → `404 no_rows`.

**Gestión de socios** (tab Socios):

8. ✅ Alta de socio (nombre, email, n.º) → `201`; email o n.º repetido → `409 member_exists`.
9. ✅ Carga de deudas en lote (varios ítems en un request transaccional) → `201`.
10. ✅ "Copiar link del portal" → el link `/socios/<uuid>` que se le envía al socio una única vez (J2).
11. ✅ La lista de socios (nombres, emails, deuda pendiente) exige el admin secret — sin secret → `401`.

**Tesorería** (tab Dashboard):

12. ✅ Totales cobrados desglosados (inscripciones vs. socios), cantidad de pagos, deuda pendiente de socios y últimos pagos con pagador resuelto — los montos cuadraron exactamente con los pagos simulados del recorrido.

## J4 — Sistema: webhook de Mercado Pago y cron de holds

**Webhook `POST /api/webhooks/mercadopago`** (única fuente de verdad de pagos):

- ✅ Firma inválida → `200 {received:true}` (contrato siempre-200 de MP) **sin ningún efecto en la base**, con log del rechazo (`SignatureMismatch`).
- ✅ Firma válida (HMAC-SHA256 real sobre `id:{id};request-id:{req};ts:{ts};` con el secret) → pasa el gate y procesa; un error interno posterior (p. ej. payment id inexistente en MP) también responde `200` y queda logueado.
- ⚠️ **Hallazgo durante esta prueba:** con `ts` en **segundos** (formato documentado por MP) la firma válida fue rechazada por `TimestampOutOfTolerance`; solo pasó con `ts` en **milisegundos**. Ver hallazgo #1 de [`docs/project-review.md`](./project-review.md) — potencialmente bloqueante para producción.
- 🧪 Ruteo por `external_reference` (UUID pelado → inscripción; `member_debt:` → deuda de socio), idempotencia del ledger, y ramas approved/rejected — cubierto por la suite con SDK mockeado; el efecto final sobre la base se verificó vía la simulación psql de J1/J2.

**Cron de holds `GET|POST /api/admin/release-expired-holds`** (Vercel Cron cada 5 min en producción, `npm run dev:cron` en local):

- ✅ Sin credenciales → `401`. Con `Authorization: Bearer …` sin `CRON_SECRET` configurado → `401`.
- ✅ Autorizado (`x-admin-secret`) con un hold vencido → `{"released": n}`: la registración pasa a `cancelled` y el cupo vuelve a la prueba (verificado: 0 → 1).
- ⚠️ La entrada de lista de espera de esa prueba quedó **sin notificar** (`notified_at = NULL`) — contradice `docs/architecture.md`; ver hallazgo #3 del review.

---

## Cómo reproducir este recorrido

```bash
docker compose up -d && npm run db:migrate && npm run dev

# J3: crear y abrir un concurso (usar el ADMIN_SECRET de tu .env.local)
curl -X POST -H "x-admin-secret: $ADMIN_SECRET" -H 'Content-Type: application/json' \
  localhost:3000/api/admin/competitions -d '{ "title":"…", "dateFrom":"…", … }'
curl -X PATCH -H "x-admin-secret: $ADMIN_SECRET" -H 'Content-Type: application/json' \
  localhost:3000/api/admin/competitions/<id> -d '{"status":"open"}'

# J1: inscripción (devuelve checkoutUrl real con credenciales de test de MP)
curl -X POST -H 'Content-Type: application/json' localhost:3000/api/registrations \
  -d '{"eventId":"<pruebaId>","participantName":"…","participantEmail":"…","horseName":"…","boxRequested":true}'

# Confirmación del webhook, simulada como documentan fase1/fase2-4:
docker exec eventos-postgres-1 psql -U eventos -d eventos -c \
  "UPDATE registrations SET status='confirmed', confirmed_at=now(), mp_payment_id='SIM-1' WHERE id='<regId>';
   INSERT INTO payment_events (source, source_id, amount_ars, mp_payment_id)
   VALUES ('registration','<regId>', <centavos>, 'SIM-1');"

# J4: vencer y liberar un hold
docker exec eventos-postgres-1 psql -U eventos -d eventos -c \
  "UPDATE registrations SET hold_expires_at = now() - interval '1 minute' WHERE id='<regId>'"
curl -X POST -H "x-admin-secret: $ADMIN_SECRET" localhost:3000/api/admin/release-expired-holds
```

Lo único **no** reproducible en local sigue siendo lo ya documentado: completar un pago real en el checkout de MP (necesita cuenta compradora de test y webhook accesible públicamente) y el envío real de emails vía Resend.
