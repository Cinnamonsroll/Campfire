CREATE TABLE locations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_key TEXT NOT NULL UNIQUE
);
