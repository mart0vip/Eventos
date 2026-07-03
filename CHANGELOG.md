# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo, siguiendo el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [0.2.0] - Unreleased

### Added

- Fase 1 del Sistema de Concursos (`/concursos`, `/admin`): inscripción a pruebas con pago vía Mercado Pago Checkout Pro, sorteo, cálculo de deuda por binomio y panel de administración completo (Anteprograma, Inscriptos, Sorteo, Deuda, Exportar).
- Backend en PostgreSQL (`src/lib/db/`, driver `pg` sin ORM) — coexiste con la app de eventos original en `localStorage`, sin reemplazarla.
- Webhook de Mercado Pago como única fuente de verdad para confirmar inscripciones, con verificación de firma vía el SDK oficial (`WebhookSignatureValidator`).
- Envío de comprobante de inscripción por email vía Resend.
- Cron de liberación de holds vencidos (`/api/admin/release-expired-holds`), configurado para Vercel Cron en producción y para `npm run dev:cron` en local.
- Scaffolding (rutas `501`) para Fases 2-4: portal de socios, exportación XLSX al sistema legado del club, dashboard de tesorería.
- `docker-compose.yml` con Postgres local para desarrollo, y `docs/fase1-setup.md` con la guía de setup completa.

### Fixed

- Corrección de fechas mostradas con desfase de zona horaria en varios lugares (uso de `parseISO` en vez de `new Date` sobre strings de solo fecha).
