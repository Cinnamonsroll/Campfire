CREATE TABLE player_buffs (
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  buff_key   TEXT NOT NULL,
  stacks     INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (player_id, buff_key)
);

CREATE INDEX idx_player_buffs_player ON player_buffs (player_id);

CREATE TABLE wildlife_album (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  species_key           TEXT NOT NULL,
  location_key          TEXT NOT NULL,
  best_rank             INTEGER NOT NULL DEFAULT 0,
  best_quality          TEXT NOT NULL DEFAULT 'good',
  first_photographed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (player_id, species_key)
);

CREATE INDEX idx_wildlife_album_player ON wildlife_album (player_id);
