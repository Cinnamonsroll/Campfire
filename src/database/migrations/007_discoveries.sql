CREATE TABLE discoveries (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discovery_key  TEXT NOT NULL UNIQUE
);

CREATE TABLE player_discoveries (
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  discovery_id  UUID NOT NULL REFERENCES discoveries(id) ON DELETE CASCADE,
  found_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (player_id, discovery_id)
);

CREATE INDEX idx_discoveries_player ON player_discoveries (player_id);
