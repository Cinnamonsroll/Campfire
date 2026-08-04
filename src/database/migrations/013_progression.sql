ALTER TABLE quests
  ADD COLUMN title TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN emoji TEXT,
  ADD COLUMN quest_type TEXT NOT NULL DEFAULT 'collect',
  ADD COLUMN target_key TEXT,
  ADD COLUMN target INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN reward_xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN reward_coins INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_quests_daily
  ON player_quests (player_id, quest_id, date);

ALTER TABLE player_quests
  ADD COLUMN claimed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE players
  ADD COLUMN total_adventures INTEGER NOT NULL DEFAULT 0;

ALTER TABLE player_camp
  ADD COLUMN camp_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN tent_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN campfire_level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN storage_level INTEGER NOT NULL DEFAULT 1;

CREATE TABLE achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  achievement_key TEXT NOT NULL UNIQUE
);

CREATE TABLE player_achievements (
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (player_id, achievement_id)
);

CREATE INDEX idx_achievements_player ON player_achievements (player_id);
