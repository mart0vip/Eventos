# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo, siguiendo el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [0.3.0] - Unreleased

### Added

- Fase 2 — Portal de socios: alta de socios y carga de deudas (cuota, pensión, ropero, otro) desde el nuevo tab "Socios" del panel admin; portal público `/socios/[id]` con link permanente por socio, desglose de deuda y pago online por ítem vía Mercado Pago; comprobante automático por email al confirmarse el pago (webhook).
- Fase 3 — Exportación al sistema legado: `GET /api/admin/export` genera el XLSX diario (ExcelJS) con las columnas de la spec, registra cada generación en `export_logs`, y se descarga desde el tab "Exportar" eligiendo el día.
- Fase 4 — Dashboard de tesorería: tab "Dashboard" del panel admin con totales cobrados (por inscripciones y por socios, desde el ledger `payment_events` que ahora alimenta el webhook), deuda pendiente de socios y últimos pagos.
- Migración `002_fase2_socios.sql`: `mp_preference_id` en `member_debts`, índices nuevos y unicidad de `mp_payment_id` en `payment_events` (idempotencia ante reintentos del webhook).

### Changed

- El webhook de Mercado Pago ahora rutea por `external_reference`: los pagos de deudas de socio usan el prefijo `member_debt:` y los de inscripciones siguen usando el UUID pelado; todo pago aprobado se registra además en `payment_events`.

## [0.2.0] - Unreleased

### Added

- Fase 1 del Sistema de Concursos (`/concursos`, `/admin`): inscripción a pruebas con pago vía Mercado Pago Checkout Pro, sorteo, cálculo de deuda por binomio y panel de administración completo (Anteprograma, Inscriptos, Sorteo, Deuda, Exportar).
- Backend en PostgreSQL (`src/lib/db/`, driver `pg` sin ORM) — coexiste con la app de eventos original en `localStorage`, sin reemplazarla.
- Webhook de Mercado Pago como única fuente de verdad para confirmar inscripciones, con verificación de firma vía el SDK oficial (`WebhookSignatureValidator`).
- Envío de comprobante de inscripción por email vía Resend.
- Cron de liberación de holds vencidos (`/api/admin/release-expired-holds`), configurado para Vercel Cron en producción y para `npm run dev:cron` en local.
- Scaffolding (rutas `501`) para Fases 2-4: portal de socios, exportación XLSX al sistema legado del club, dashboard de tesorería.
- `docker-compose.yml` con Postgres local para desarrollo, y `docs/fase1-setup.md` con la guía de setup completa.
- Identidad de marca real del Club Hípico Argentino (`docs/MarcaCHA.md`): paleta de colores, tipografía (Montserrat + Open Sans vía `next/font/google`), logo y favicon reales.
- Barra superior (`TopBar`) con datos de contacto y redes sociales (Facebook, Instagram) del club.

### Changed

- Rediseño completo de la identidad visual de la app (antes placeholder "Equestrian Events"): paleta de colores azul/neutros, tipografía real, botones cuadrados en mayúscula, header reestructurado (topbar + nav blanco), footer con datos reales de contacto. Aplicado a toda la app, tanto la demo original en inglés como el sistema de concursos en español.
- Reemplazo del nombre de marca placeholder por "Club Hípico Argentino" en toda la app, el email de confirmación y la documentación (README, planning, architecture).

### Fixed

- Corrección de fechas mostradas con desfase de zona horaria en varios lugares (uso de `parseISO` en vez de `new Date` sobre strings de solo fecha).
