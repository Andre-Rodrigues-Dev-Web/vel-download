PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  target_dir TEXT NOT NULL,
  file_path TEXT,
  category TEXT,
  priority INTEGER NOT NULL DEFAULT 5,
  browser_source TEXT NOT NULL DEFAULT 'app',
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  total_bytes INTEGER NOT NULL DEFAULT 0,
  downloaded_bytes INTEGER NOT NULL DEFAULT 0,
  speed_bytes_per_sec REAL NOT NULL DEFAULT 0,
  eta_seconds INTEGER,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  resumable INTEGER NOT NULL DEFAULT 0,
  source_reference TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  download_id INTEGER,
  message TEXT NOT NULL,
  stack TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS action_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  download_id INTEGER,
  action TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (download_id) REFERENCES downloads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
CREATE INDEX IF NOT EXISTS idx_downloads_created_at ON downloads(created_at);
CREATE INDEX IF NOT EXISTS idx_downloads_browser_source ON downloads(browser_source);
CREATE INDEX IF NOT EXISTS idx_action_history_download_id ON action_history(download_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_download_id ON error_logs(download_id);

CREATE TRIGGER IF NOT EXISTS trg_downloads_updated_at
AFTER UPDATE ON downloads
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE downloads SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_settings_updated_at
AFTER UPDATE ON settings
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE key = OLD.key;
END;
