const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { appConfig } = require("../config");
const logger = require("../utils/logger");

let db;

function initializeDatabase() {
  const dbDir = path.dirname(appConfig.databasePath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(appConfig.databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const schema = fs.readFileSync(appConfig.databaseSchemaPath, "utf8");
  db.exec(schema);

  logger.info("SQLite inicializado", { database: appConfig.databasePath });
  return db;
}

function getDb() {
  if (!db) {
    return initializeDatabase();
  }

  return db;
}

module.exports = {
  initializeDatabase,
  getDb
};
