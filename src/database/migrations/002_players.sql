CREATE TABLE players (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discord_id  TEXT NOT NULL UNIQUE,
  character_name TEXT,
  level       INTEGER NOT NULL DEFAULT 1,
  xp          INTEGER NOT NULL DEFAULT 0,
  coins       INTEGER NOT NULL DEFAULT 0,
  energy      INTEGER NOT NULL DEFAULT 100,
  last_energy_reset TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_players_discord_id ON players (discord_id);
