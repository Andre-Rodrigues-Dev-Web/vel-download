const { z } = require("zod");
const settingsRepository = require("../repositories/settingsRepository");
const realtimeGateway = require("../events/realtimeGateway");
const { parseBoolean, parseNumber } = require("../utils/parsers");

const settingsInputSchema = z
  .object({
    defaultDownloadDir: z.string().min(1).max(400).optional(),
    maxConcurrentDownloads: z.coerce.number().int().min(1).max(10).optional(),
    maxAutoRetries: z.coerce.number().int().min(0).max(10).optional(),
    theme: z.enum(["dark", "light"]).optional(),
    launchOnStartup: z.union([z.boolean(), z.string()]).optional(),
    completionNotifications: z.union([z.boolean(), z.string()]).optional(),
    autoCleanupDays: z.coerce.number().int().min(7).max(3650).optional()
  })
  .strict();

function mapRawToTyped(raw) {
  return {
    defaultDownloadDir: raw.defaultDownloadDir,
    maxConcurrentDownloads: parseNumber(raw.maxConcurrentDownloads, 3),
    maxAutoRetries: parseNumber(raw.maxAutoRetries, 3),
    theme: raw.theme === "light" ? "light" : "dark",
    launchOnStartup: parseBoolean(raw.launchOnStartup),
    completionNotifications: parseBoolean(raw.completionNotifications, true),
    autoCleanupDays: parseNumber(raw.autoCleanupDays, 90)
  };
}

class SettingsService {
  getSettings() {
    const raw = settingsRepository.getAllSettings();
    return mapRawToTyped(raw);
  }

  updateSettings(payload) {
    const parsed = settingsInputSchema.parse(payload);

    const normalized = {};

    if (Object.prototype.hasOwnProperty.call(parsed, "defaultDownloadDir")) {
      normalized.defaultDownloadDir = parsed.defaultDownloadDir;
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "maxConcurrentDownloads")) {
      normalized.maxConcurrentDownloads = String(parsed.maxConcurrentDownloads);
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "maxAutoRetries")) {
      normalized.maxAutoRetries = String(parsed.maxAutoRetries);
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "theme")) {
      normalized.theme = parsed.theme;
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "launchOnStartup")) {
      normalized.launchOnStartup = String(parseBoolean(parsed.launchOnStartup));
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "completionNotifications")) {
      normalized.completionNotifications = String(parseBoolean(parsed.completionNotifications, true));
    }

    if (Object.prototype.hasOwnProperty.call(parsed, "autoCleanupDays")) {
      normalized.autoCleanupDays = String(parsed.autoCleanupDays);
    }

    const raw = settingsRepository.updateSettings(normalized);
    const typed = mapRawToTyped(raw);

    realtimeGateway.broadcast("settings-updated", typed);
    return typed;
  }

  getMaxConcurrentDownloads() {
    return this.getSettings().maxConcurrentDownloads;
  }

  getMaxAutoRetries() {
    return this.getSettings().maxAutoRetries;
  }

  getDefaultDownloadDir() {
    return this.getSettings().defaultDownloadDir;
  }
}

module.exports = new SettingsService();
