CREATE TABLE quests (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_key TEXT NOT NULL UNIQUE
);

CREATE TABLE player_quests (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  quest_id   UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  completed  BOOLEAN NOT NULL DEFAULT FALSE,
  progress   INTEGER NOT NULL DEFAULT 0,
  date       DATE NOT NULL
);

CREATE INDEX idx_quests_player ON player_quests (player_id);
