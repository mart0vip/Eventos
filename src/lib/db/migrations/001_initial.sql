-- Fase 1: Sistema de Concursos de Equitación — initial schema.
-- gen_random_uuid() is built into Postgres core since v13, but pgcrypto is
-- CREATE EXTENSION IF NOT EXISTS'd here as a zero-cost safety net in case this
-- migration ever targets an older engine image.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

CREATE INDEX idx_competition_days_competition_id ON competition_days(competition_id);

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

CREATE INDEX idx_events_day_id ON events(day_id);

-- Binomios (jinete + caballo — unidad de participación)
-- Un jinete puede tener múltiples caballos; un caballo puede tener un solo jinete activo
CREATE TABLE binomios (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_name  TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  horse_name        TEXT NOT NULL,
  license_number    TEXT,           -- licencia federada (opcional)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un email + caballo siempre es el mismo binomio (dedupe rule) — load-bearing for
-- findOrCreateBinomio()'s ON CONFLICT upsert, and for correctness under concurrent
-- registrations for a brand-new binomio.
CREATE UNIQUE INDEX idx_binomios_email_horse ON binomios(participant_email, horse_name);

-- Inscripciones (un binomio se inscribe a una prueba)
CREATE TABLE registrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID NOT NULL REFERENCES events(id),
  binomio_id       UUID NOT NULL REFERENCES binomios(id),
  box_requested    BOOLEAN NOT NULL DEFAULT false,
  draw_order       INTEGER,          -- asignado por el sorteo; NULL hasta que se ejecute
  status           TEXT NOT NULL DEFAULT 'pending_payment',
    -- pending_payment | confirmed | cancelled | waitlisted
  hold_expires_at  TIMESTAMPTZ,      -- NULL una vez confirmado o cancelado
  mp_preference_id TEXT,
  mp_payment_id    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at     TIMESTAMPTZ
);

CREATE INDEX idx_registrations_event_status ON registrations(event_id, status);
CREATE INDEX idx_registrations_binomio_id ON registrations(binomio_id);

-- A binomio can't have two simultaneously-live registrations for the same
-- prueba — but a *cancelled* one (expired hold, rejected payment) must not
-- permanently block re-registration, so this is a partial index over
-- non-cancelled rows rather than an unconditional UNIQUE(event_id, binomio_id)
-- table constraint (the literal spec text would otherwise lock a binomio out
-- of a prueba forever after their very first hold expires).
CREATE UNIQUE INDEX idx_registrations_event_binomio_active
  ON registrations(event_id, binomio_id)
  WHERE status != 'cancelled';

-- Lista de espera (separada para no contaminar available_slots)
CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES events(id),
  binomio_id  UUID NOT NULL REFERENCES binomios(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified_at TIMESTAMPTZ
);

CREATE INDEX idx_waitlist_event_id ON waitlist(event_id);

-- ============================================================
-- Scaffolding para Fases 2-4 (tablas vacías — no se implementa lógica en Fase 1)
-- ============================================================

-- FASE 2: Portal de socios
CREATE TABLE members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  member_number TEXT NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE member_debts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id),
  concept       TEXT NOT NULL,  -- 'cuota' | 'pension' | 'ropero' | 'otro'
  amount_ars    INTEGER NOT NULL,
  due_date      DATE NOT NULL,
  paid_at       TIMESTAMPTZ,
  mp_payment_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FASE 3: Log de exportaciones al sistema legacy
CREATE TABLE export_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  export_date DATE NOT NULL,
  file_name   TEXT NOT NULL,
  row_count   INTEGER NOT NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exported_by TEXT          -- 'cron' | 'manual'
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
