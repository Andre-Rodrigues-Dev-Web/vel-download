const http = require("http");
const app = require("./app");
const { appConfig } = require("./config");
const { initializeDatabase } = require("./repositories/database");
const settingsRepository = require("./repositories/settingsRepository");
const downloadManager = require("./services/downloadManager");
const systemDownloadMonitor = require("./services/systemDownloadMonitor");
const logger = require("./utils/logger");

initializeDatabase();
settingsRepository.ensureDefaultSettings();
downloadManager.bootstrap();
systemDownloadMonitor.start();

const server = http.createServer(app);

server.listen(appConfig.serverPort, "127.0.0.1", () => {
  logger.info("API local iniciada", {
    port: appConfig.serverPort,
    host: "127.0.0.1",
    mode: process.env.NODE_ENV || "development"
  });
});

function shutdown(signal) {
  logger.warn("Encerrando servidor", { signal });
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
