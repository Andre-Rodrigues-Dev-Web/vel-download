const path = require("path");
const downloadRepository = require("../repositories/downloadRepository");
const settingsService = require("./settingsService");
const downloadManager = require("./downloadManager");
const { buildFileNameFromUrl, sanitizeFileName } = require("../utils/parsers");

function parseIso(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function detectStatus(snapshot = {}) {
  if (snapshot.state === "complete") {
    return "completed";
  }

  if (snapshot.state === "interrupted") {
    const errorText = String(snapshot.error || "").toLowerCase();
    if (errorText.includes("canceled") || errorText.includes("cancelled") || errorText.includes("user")) {
      return "canceled";
    }

    return "error";
  }

  if (snapshot.paused) {
    return "paused";
  }

  if (snapshot.state === "in_progress") {
    return "downloading";
  }

  return "queued";
}

function buildSourceReference(browser, downloadId) {
  return `ext:${browser}:${String(downloadId)}`;
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

class BrowserExtensionService {
  createDownloadFromExtension(payload) {
    const browser = payload.browser || "chrome";

    const created = downloadManager.createDownload({
      url: payload.url,
      fileName: payload.fileName,
      targetDir: payload.targetDir,
      category: payload.category || "Extensão",
      priority: payload.priority,
      browserSource: browser
    });

    downloadRepository.logAction(created.id, "extension_download_requested", {
      browser,
      requestedAt: new Date().toISOString()
    });

    return created;
  }

  ingestEvent(payload) {
    const browser = payload.browser || "chrome";
    const eventType = payload.eventType || "changed";
    const item = payload.item || {};

    const sourceReference = buildSourceReference(browser, item.downloadId);
    const existing = downloadRepository.findBySourceReference(sourceReference);

    const url = item.finalUrl || item.url || existing?.url || "about:blank";
    const filePath = item.filePath || existing?.file_path || null;
    const fileName = sanitizeFileName(
      item.fileName ||
        (filePath ? path.basename(filePath) : existing?.file_name || buildFileNameFromUrl(url, "arquivo"))
    );

    const targetDir =
      item.targetDir ||
      (filePath ? path.dirname(filePath) : existing?.target_dir || settingsService.getDefaultDownloadDir());

    const totalBytes = Math.max(parseNumber(item.totalBytes, 0), parseNumber(existing?.total_bytes, 0));
    const downloadedBytes = Math.max(parseNumber(item.bytesReceived, 0), parseNumber(existing?.downloaded_bytes, 0));
    const status = eventType === "erased" ? "canceled" : detectStatus(item);
    const progress =
      status === "completed"
        ? 100
        : totalBytes > 0
          ? Math.min((downloadedBytes / totalBytes) * 100, 99.99)
          : parseNumber(existing?.progress, 0);

    const startedAt = parseIso(item.startTime) || existing?.started_at || new Date().toISOString();
    const completedAt =
      status === "completed" || status === "canceled" || status === "error"
        ? parseIso(item.endTime) || existing?.completed_at || new Date().toISOString()
        : null;

    const changes = {
      url,
      file_name: fileName,
      target_dir: targetDir,
      file_path: filePath,
      browser_source: browser,
      status,
      progress,
      total_bytes: totalBytes,
      downloaded_bytes: downloadedBytes,
      started_at: startedAt,
      completed_at: completedAt,
      resumable: item.canResume ? 1 : 0,
      error_message: status === "error" ? item.error || "Falha no download do navegador" : null,
      source_reference: sourceReference
    };

    let persisted;

    if (existing) {
      persisted = downloadRepository.updateDownload(existing.id, changes);
    } else {
      persisted = downloadRepository.createDownload({
        url,
        fileName,
        targetDir,
        filePath,
        category: "Navegador",
        priority: 4,
        browserSource: browser,
        status,
        progress,
        totalBytes,
        downloadedBytes,
        speed: 0,
        etaSeconds: null,
        startedAt,
        completedAt,
        errorMessage: changes.error_message,
        attempts: 0,
        resumable: item.canResume,
        sourceReference
      });
    }

    downloadRepository.logAction(persisted.id, "extension_download_event", {
      eventType,
      status,
      browser,
      sourceReference
    });

    downloadManager.broadcastDownloadUpdate(persisted.id);

    return {
      eventType,
      status,
      download: persisted
    };
  }
}

module.exports = new BrowserExtensionService();
