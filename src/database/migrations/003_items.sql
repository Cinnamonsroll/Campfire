CREATE TABLE items (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_key  TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
