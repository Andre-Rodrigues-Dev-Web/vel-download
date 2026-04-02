const os = require("os");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const ROOT_DIR = path.resolve(__dirname, "../../..");
const DATABASE_DIR = path.join(ROOT_DIR, "database");
const DATABASE_PATH = path.join(DATABASE_DIR, "vel-download.sqlite");
const SCHEMA_PATH = path.join(DATABASE_DIR, "schema.sql");

const appConfig = {
  appName: "Vel Download",
  serverPort: Number(process.env.SERVER_PORT || 4000),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 30000),
  downloadTransferTimeoutMs: Number(process.env.DOWNLOAD_TRANSFER_TIMEOUT_MS || 0),
  maxConcurrentDownloads: Number(process.env.MAX_CONCURRENT_DOWNLOADS || 3),
  maxDownloadRetries: Number(process.env.MAX_DOWNLOAD_RETRIES || 3),
  retryDelayMs: Number(process.env.DOWNLOAD_RETRY_DELAY_MS || 2000),
  defaultDownloadDir: process.env.DEFAULT_DOWNLOAD_DIR || path.join(os.homedir(), "Downloads"),
  historyCleanupDays: Number(process.env.HISTORY_CLEANUP_DAYS || 90),
  databasePath: DATABASE_PATH,
  databaseSchemaPath: SCHEMA_PATH,
  logsDir: path.join(DATABASE_DIR, "logs"),
  extensionSharedToken: String(process.env.EXTENSION_SHARED_TOKEN || "").trim(),
  allowInsecureTlsFallback:
    String(process.env.ALLOW_INSECURE_TLS_FALLBACK || "false").toLowerCase() === "true"
};

const defaultSettings = {
  defaultDownloadDir: appConfig.defaultDownloadDir,
  maxConcurrentDownloads: String(appConfig.maxConcurrentDownloads),
  maxAutoRetries: String(appConfig.maxDownloadRetries),
  theme: "dark",
  launchOnStartup: "false",
  completionNotifications: "true",
  autoCleanupDays: String(appConfig.historyCleanupDays)
};

const validStatuses = [
  "queued",
  "downloading",
  "paused",
  "completed",
  "error",
  "canceled"
];

const validSortOptions = [
  "newest",
  "oldest",
  "largest",
  "smallest"
];

const retryableStatusCodes = [408, 425, 429, 500, 502, 503, 504];

module.exports = {
  appConfig,
  defaultSettings,
  validStatuses,
  validSortOptions,
  retryableStatusCodes,
  ROOT_DIR
};
