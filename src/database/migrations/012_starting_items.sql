INSERT INTO items (item_key) VALUES
  ('canvas_backpack'),
  ('worn_tent'),
  ('old_fishing_rod'),
  ('disposable_camera')
ON CONFLICT (item_key) DO NOTHING;
