CREATE TABLE player_equipment (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  slot       TEXT NOT NULL,
  durability INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_equipment_player ON player_equipment (player_id);
CREATE INDEX idx_equipment_slot  ON player_equipment (slot);
