CREATE TABLE statistic_definitions (
  key        TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  unit       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE players
  ADD COLUMN caught_fish        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN items_collected    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN coins_earned       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN coins_spent        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN upgrades_purchased INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN quests_completed   INTEGER NOT NULL DEFAULT 0;

CREATE TABLE player_location_visits (
  player_id     UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  location_key  TEXT NOT NULL,
  first_visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (player_id, location_key)
);

CREATE INDEX idx_location_visits_player ON player_location_visits (player_id);

INSERT INTO statistic_definitions (key, label, emoji, unit, sort_order) VALUES
  ('adventures',         'Adventures',       '🥾', NULL,      1),
  ('trails_unlocked',    'Trails Unlocked',  '🗺️', NULL,      2),
  ('caught_fish',        'Fish Caught',      '🐟', NULL,      3),
  ('items_collected',    'Items Collected',  '📦', NULL,      4),
  ('quests_completed',   'Quests Completed', '📋', NULL,      5),
  ('upgrades_purchased', 'Upgrades Bought',  '🔨', NULL,      6),
  ('journal_completion', 'Journal',          '📔', '%',       7),
  ('coins_earned',       'Coins Earned',     '🪙', NULL,      8),
  ('coins_spent',        'Coins Spent',      '💰', NULL,      9);
