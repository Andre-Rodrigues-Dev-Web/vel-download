const fs = require("fs");
const path = require("path");

function resolveDatabaseDriver() {
  try {
    return require("better-sqlite3");
  } catch {
    return require(path.resolve(__dirname, "../server/node_modules/better-sqlite3"));
  }
}

const Database = resolveDatabaseDriver();

const schemaPath = path.resolve(__dirname, "schema.sql");
const dbPath = path.resolve(__dirname, "vel-download.sqlite");

if (!fs.existsSync(schemaPath)) {
  throw new Error("Arquivo schema.sql não encontrado em /database");
}

const schema = fs.readFileSync(schemaPath, "utf8");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(schema);
db.close();

console.log(`Banco inicializado em: ${dbPath}`);
