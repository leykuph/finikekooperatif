-- Uygulama her açılışta çalıştırır; yalnızca eksik olanı oluşturur.

CREATE TABLE IF NOT EXISTS members (
  id                   bigserial PRIMARY KEY,
  member_no            text NOT NULL UNIQUE,
  full_name            text NOT NULL,
  password_hash        text NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  active               boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  last_login_at        timestamptz
);

-- Çerezdeki jetonun kendisi değil, SHA-256 özeti saklanır.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  member_id  bigint NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_member_id_idx ON sessions (member_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);

ALTER TABLE members ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Ortağın beyan ettiği parseller. Bilgiler eklendiği anda TKGM'den alınır ve burada saklanır.
-- Hisseli parseller için aynı parsel birden fazla ortakta olabilir.
CREATE TABLE IF NOT EXISTS parcels (
  id           bigserial PRIMARY KEY,
  member_id    bigint NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  mahalle_id   integer NOT NULL,
  mahalle_name text NOT NULL,
  ada          text NOT NULL,
  parsel       text NOT NULL,
  nitelik      text,
  area_m2      numeric(14, 2),
  mevkii       text,
  pafta        text,
  geometry     jsonb,
  fetched_at   timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, mahalle_id, ada, parsel)
);

CREATE INDEX IF NOT EXISTS parcels_lookup_idx ON parcels (mahalle_id, ada, parsel);
