const { getDb } = require("./database");
const { defaultSettings } = require("../config");

function ensureDefaultSettings() {
  const db = getDb();
  const statement = db.prepare(
    "INSERT OR IGNORE INTO settings(key, value) VALUES (?, ?)"
  );

  const tx = db.transaction(() => {
    Object.entries(defaultSettings).forEach(([key, value]) => {
      statement.run(key, String(value));
    });
  });

  tx();
}

function getAllSettings() {
  ensureDefaultSettings();

  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all();

  const settings = { ...defaultSettings };
  rows.forEach((row) => {
    settings[row.key] = row.value;
  });

  return settings;
}

function updateSettings(partialSettings) {
  if (!partialSettings || !Object.keys(partialSettings).length) {
    return getAllSettings();
  }

  const db = getDb();
  const statement = db.prepare(
    "INSERT INTO settings(key, value) VALUES(@key, @value) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );

  const tx = db.transaction((payload) => {
    Object.entries(payload).forEach(([key, value]) => {
      statement.run({ key, value: String(value) });
    });
  });

  tx(partialSettings);
  return getAllSettings();
}

module.exports = {
  getAllSettings,
  updateSettings,
  ensureDefaultSettings
};
