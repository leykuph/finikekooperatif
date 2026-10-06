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

-- İlk şifre (TC kimlik no + telefonun son 4 hanesi) için süre ve hatalı deneme kilidi.
ALTER TABLE members ADD COLUMN IF NOT EXISTS failed_logins integer NOT NULL DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS initial_password_expires_at timestamptz;

-- Hesabı yönetim sayfasından açan yönetici (komut satırından açılanlarda boş).
ALTER TABLE members ADD COLUMN IF NOT EXISTS created_by bigint REFERENCES members(id) ON DELETE SET NULL;

-- Parseldeki ağaçlar: aynı cins ve yaştaki ağaçlar bir grup olarak girilir.
CREATE TABLE IF NOT EXISTS trees (
  id          bigserial PRIMARY KEY,
  parcel_id   bigint NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  species     text NOT NULL,
  age_years   smallint NOT NULL,
  tree_count  integer NOT NULL,
  est_tons    numeric(10, 2) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trees_parcel_id_idx ON trees (parcel_id);
