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
