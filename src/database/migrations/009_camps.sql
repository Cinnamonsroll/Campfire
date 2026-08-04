CREATE TABLE camp_upgrades (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upgrade_key  TEXT NOT NULL UNIQUE
);

CREATE TABLE player_camp (
  player_id       UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  current_upgrade TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
