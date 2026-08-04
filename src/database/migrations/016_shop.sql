CREATE TABLE shop_purchases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  date        TEXT NOT NULL,
  item_key    TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  price_paid  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (player_id, date, item_key)
);
