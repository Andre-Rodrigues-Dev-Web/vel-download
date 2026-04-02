const fs = require("fs");
const path = require("path");
const { appConfig } = require("../config");

const LOG_FILE = path.join(appConfig.logsDir, "server.log");

function ensureLogDir() {
  if (!fs.existsSync(appConfig.logsDir)) {
    fs.mkdirSync(appConfig.logsDir, { recursive: true });
  }
}

function write(level, message, metadata) {
  ensureLogDir();
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata ? { metadata } : {})
  };
  const line = JSON.stringify(payload);
  fs.appendFileSync(LOG_FILE, `${line}\n`, "utf8");

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info: (message, metadata) => write("info", message, metadata),
  warn: (message, metadata) => write("warn", message, metadata),
  error: (message, metadata) => write("error", message, metadata)
};
