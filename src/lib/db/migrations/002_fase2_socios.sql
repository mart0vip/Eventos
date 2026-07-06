-- Fase 2: Portal de socios — columnas e índices sobre las tablas scaffoldeadas
-- en 001_initial.sql. Las tablas members / member_debts ya existen vacías.

-- El flujo de pago de una deuda de socio replica el de registrations: se crea
-- una Preference de Mercado Pago y se persiste su id para poder auditar el
-- link generado (member_debts ya tenía mp_payment_id desde el scaffolding).
ALTER TABLE member_debts ADD COLUMN mp_preference_id TEXT;

CREATE INDEX idx_member_debts_member_id ON member_debts(member_id);

-- FASE 4: el dashboard agrega sobre payment_events por fecha de recepción.
CREATE INDEX idx_payment_events_received_at ON payment_events(received_at);

-- Mercado Pago reintenta webhooks; el ledger debe quedar libre de duplicados
-- incluso bajo reintentos concurrentes (insert con ON CONFLICT DO NOTHING).
CREATE UNIQUE INDEX idx_payment_events_mp_payment_id ON payment_events(mp_payment_id);
