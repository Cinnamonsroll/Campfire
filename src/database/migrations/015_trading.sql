ALTER TABLE trades
  ADD COLUMN sender_ready   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN receiver_ready BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN expires_at     TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '5 minutes',
  ADD COLUMN message_id     TEXT,
  ADD COLUMN channel_id     TEXT;

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_status_check;
ALTER TABLE trades ADD CONSTRAINT trades_status_check
  CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed'));

CREATE TABLE trade_offers (
  trade_id  UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coins     INTEGER NOT NULL DEFAULT 0,
  items     JSONB NOT NULL DEFAULT '{}'::jsonb,

  PRIMARY KEY (trade_id, player_id)
);

CREATE INDEX idx_trade_offers_player ON trade_offers (player_id);
