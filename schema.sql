-- Runs on every start. Add your own tables here.
CREATE TABLE IF NOT EXISTS items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  data       TEXT NOT NULL,            -- JSON of the fields in config.json
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
