const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const axios = require("axios");
const { pipeline } = require("stream/promises");
const downloadRepository = require("../repositories/downloadRepository");
const realtimeGateway = require("../events/realtimeGateway");
const settingsService = require("./settingsService");
const { appConfig, retryableStatusCodes } = require("../config");
const { AppError } = require("../utils/errors");
const { sanitizeFileName, buildFileNameFromUrl } = require("../utils/parsers");
const logger = require("../utils/logger");

function parseContentRangeTotal(value) {
  if (!value || typeof value !== "string") {
    return 0;
  }

  const parts = value.split("/");
  if (parts.length < 2) {
    return 0;
  }

  const total = Number(parts[1]);
  return Number.isFinite(total) ? total : 0;
}

function nowIso() {
  return new Date().toISOString();
}

class DownloadManager {
  constructor() {
    this.queue = [];
    this.activeTasks = new Map();
  }

  bootstrap() {
    downloadRepository.updateManyByStatus("downloading", {
      status: "paused",
      speed_bytes_per_sec: 0,
      eta_seconds: null,
      error_message: "Download pausado após reinício da aplicação"
    });

    const queued = downloadRepository.listDownloads({
      status: "queued",
      sort: "oldest"
    });

    queued.forEach((item) => {
      this.enqueueExisting(item.id, item.priority);
    });

    this.processQueue();
  }

  listDownloads(filters = {}) {
    return downloadRepository.listDownloads(filters);
  }

  getDownloadById(id) {
    return downloadRepository.getDownloadById(id);
  }

  createDownload(payload) {
    const defaultDir = settingsService.getDefaultDownloadDir();
    const targetDir = payload.targetDir || defaultDir;
    const resolvedFileName = sanitizeFileName(
      payload.fileName || buildFileNameFromUrl(payload.url, "download.bin")
    );

    const created = downloadRepository.createDownload({
      url: payload.url,
      fileName: resolvedFileName,
      targetDir,
      category: payload.category || null,
      priority: payload.priority ?? 5,
      browserSource: payload.browserSource || "app",
      status: "queued",
      progress: 0,
      attempts: 0
    });

    downloadRepository.logAction(created.id, "download_created", {
      url: created.url,
      targetDir: created.target_dir
    });

    this.enqueueExisting(created.id, created.priority);
    this.broadcastDownloadUpdate(created.id);
    this.processQueue();

    return created;
  }

  importExternalDownload(payload) {
    const fileName = sanitizeFileName(
      payload.fileName ||
        (payload.filePath ? path.basename(payload.filePath) : buildFileNameFromUrl(payload.url, "arquivo"))
    );

    const duplicate = downloadRepository.findExistingImported({
      url: payload.url,
      filePath: payload.filePath,
      browserSource: payload.browserSource,
      fileName
    });

    if (duplicate) {
      return { imported: false, duplicate: true, download: duplicate };
    }

    const resolvedTargetDir =
      payload.targetDir ||
      (payload.filePath ? path.dirname(payload.filePath) : settingsService.getDefaultDownloadDir());

    const download = downloadRepository.createDownload({
      url: payload.url || "about:blank",
      fileName,
      targetDir: resolvedTargetDir,
      filePath: payload.filePath || null,
      category: payload.category || "Importado",
      priority: payload.priority ?? 4,
      browserSource: payload.browserSource || "system",
      status: payload.status || "completed",
      progress: payload.progress ?? 100,
      totalBytes: payload.totalBytes ?? payload.downloadedBytes ?? 0,
      downloadedBytes: payload.downloadedBytes ?? payload.totalBytes ?? 0,
      speed: 0,
      etaSeconds: null,
      startedAt: payload.startedAt || null,
      completedAt: payload.completedAt || nowIso(),
      attempts: 0,
      resumable: false,
      sourceReference: payload.sourceReference || null
    });

    downloadRepository.logAction(download.id, "download_imported", {
      source: download.browser_source
    });

    this.broadcastDownloadUpdate(download.id);
    return { imported: true, duplicate: false, download };
  }

  pauseDownload(id) {
    const runtime = this.activeTasks.get(id);
    if (runtime) {
      runtime.pauseRequested = true;
      runtime.controller.abort();
      return downloadRepository.getDownloadById(id);
    }

    this.dequeue(id);
    const current = downloadRepository.getDownloadById(id);
    if (!current) {
      throw new AppError("Download não encontrado", 404);
    }

    const updated = downloadRepository.updateDownload(id, {
      status: "paused",
      speed_bytes_per_sec: 0,
      eta_seconds: null
    });

    downloadRepository.logAction(id, "download_paused", null);
    this.broadcastDownloadUpdate(id);
    return updated;
  }

  resumeDownload(id) {
    const current = downloadRepository.getDownloadById(id);

    if (!current) {
      throw new AppError("Download não encontrado", 404);
    }

    if (!["paused", "error", "canceled"].includes(current.status)) {
      throw new AppError("Apenas downloads pausados, cancelados ou com erro podem ser retomados", 400);
    }

    const updated = downloadRepository.updateDownload(id, {
      status: "queued",
      error_message: null,
      completed_at: null,
      speed_bytes_per_sec: 0,
      eta_seconds: null
    });

    downloadRepository.logAction(id, "download_resumed", null);
    this.enqueueExisting(id, updated.priority);
    this.broadcastDownloadUpdate(id);
    this.processQueue();

    return updated;
  }

  cancelDownload(id) {
    const runtime = this.activeTasks.get(id);
    if (runtime) {
      runtime.cancelRequested = true;
      runtime.controller.abort();
      return downloadRepository.getDownloadById(id);
    }

    this.dequeue(id);

    const current = downloadRepository.getDownloadById(id);
    if (!current) {
      throw new AppError("Download não encontrado", 404);
    }

    const updated = downloadRepository.updateDownload(id, {
      status: "canceled",
      speed_bytes_per_sec: 0,
      eta_seconds: null,
      completed_at: null,
      error_message: "Download cancelado pelo usuário"
    });

    downloadRepository.logAction(id, "download_canceled", null);
    this.broadcastDownloadUpdate(id);
    return updated;
  }

  retryDownload(id) {
    const current = downloadRepository.getDownloadById(id);
    if (!current) {
      throw new AppError("Download não encontrado", 404);
    }

    if (![
      "error",
      "canceled",
      "paused"
    ].includes(current.status)) {
      throw new AppError("Este download não está elegível para nova tentativa", 400);
    }

    const updated = downloadRepository.updateDownload(id, {
      status: "queued",
      error_message: null,
      completed_at: null,
      speed_bytes_per_sec: 0,
      eta_seconds: null,
      attempts: 0
    });

    downloadRepository.logAction(id, "download_retry_requested", null);
    this.enqueueExisting(id, updated.priority);
    this.broadcastDownloadUpdate(id);
    this.processQueue();

    return updated;
  }

  removeDownloadFromHistory(id) {
    if (this.activeTasks.has(id)) {
      throw new AppError("Não é possível remover um download em execução", 400);
    }

    this.dequeue(id);

    const current = downloadRepository.getDownloadById(id);
    if (!current) {
      throw new AppError("Download não encontrado", 404);
    }

    downloadRepository.logAction(id, "download_history_removed", {
      fileName: current.file_name
    });
    downloadRepository.removeDownload(id);

    realtimeGateway.broadcast("history-updated", {
      removedId: id,
      at: nowIso()
    });

    return { id };
  }

  clearCompletedHistory() {
    const result = downloadRepository.clearCompletedDownloads();
    downloadRepository.logAction(null, "history_clear_completed", {
      removedRows: result.changes
    });

    realtimeGateway.broadcast("history-updated", {
      clearedCompleted: true,
      removedRows: result.changes,
      at: nowIso()
    });

    return { removed: result.changes };
  }

  getDashboardStats() {
    return downloadRepository.getDashboardStats();
  }

  enqueueExisting(id, priority = 5) {
    if (this.queue.some((item) => item.id === id) || this.activeTasks.has(id)) {
      return;
    }

    this.queue.push({ id, priority, queuedAt: Date.now() });
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.queuedAt - b.queuedAt;
    });
  }

  dequeue(id) {
    this.queue = this.queue.filter((item) => item.id !== id);
  }

  processQueue() {
    const maxParallel = settingsService.getMaxConcurrentDownloads();

    while (this.activeTasks.size < maxParallel && this.queue.length) {
      const next = this.queue.shift();
      if (!next) {
        break;
      }

      this.startDownload(next.id).catch((error) => {
        logger.error("Falha no processamento da fila", {
          downloadId: next.id,
          message: error.message,
          stack: error.stack
        });
      });
    }
  }

  async startDownload(id) {
    const current = downloadRepository.getDownloadById(id);

    if (!current || current.status !== "queued") {
      return;
    }

    const controller = new AbortController();
    const runtime = {
      controller,
      pauseRequested: false,
      cancelRequested: false
    };

    this.activeTasks.set(id, runtime);

    const targetDir = current.target_dir || settingsService.getDefaultDownloadDir();
    const fileName = sanitizeFileName(current.file_name || buildFileNameFromUrl(current.url, `download-${id}.bin`));
    const filePath = current.file_path || path.join(targetDir, fileName);

    await fsp.mkdir(targetDir, { recursive: true });

    let downloadedBytes = 0;
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      downloadedBytes = Number(stats.size || 0);
    }

    const headers = {};
    if (downloadedBytes > 0) {
      headers.Range = `bytes=${downloadedBytes}-`;
    }

    downloadRepository.updateDownload(id, {
      status: "downloading",
      file_path: filePath,
      started_at: current.started_at || nowIso(),
      error_message: null,
      downloaded_bytes: downloadedBytes,
      speed_bytes_per_sec: 0,
      eta_seconds: null
    });

    this.broadcastDownloadUpdate(id);

    try {
      const response = await axios({
        method: "GET",
        url: current.url,
        responseType: "stream",
        timeout: appConfig.requestTimeoutMs,
        maxRedirects: 5,
        signal: controller.signal,
        headers,
        validateStatus: (status) => (status >= 200 && status < 300) || status === 206
      });

      let resumable = false;
      let totalBytes = 0;
      let appendMode = downloadedBytes > 0;

      if (response.status === 206) {
        resumable = true;
        totalBytes = parseContentRangeTotal(response.headers["content-range"]);
      } else {
        const acceptRanges = String(response.headers["accept-ranges"] || "").toLowerCase();
        resumable = acceptRanges.includes("bytes");

        if (appendMode) {
          downloadedBytes = 0;
          appendMode = false;
        }

        totalBytes = Number(response.headers["content-length"] || 0);
      }

      if (!totalBytes) {
        totalBytes = downloadedBytes + Number(response.headers["content-length"] || 0);
      }

      let lastSampleTimestamp = Date.now();
      let lastSampleBytes = downloadedBytes;
      let currentSpeed = 0;
      let lastPersistTimestamp = 0;

      const writer = fs.createWriteStream(filePath, {
        flags: appendMode ? "a" : "w"
      });

      response.data.on("data", (chunk) => {
        downloadedBytes += chunk.length;

        const now = Date.now();
        const sampleWindow = (now - lastSampleTimestamp) / 1000;

        if (sampleWindow >= 0.4) {
          currentSpeed = (downloadedBytes - lastSampleBytes) / sampleWindow;
          lastSampleBytes = downloadedBytes;
          lastSampleTimestamp = now;
        }

        if (now - lastPersistTimestamp >= 500) {
          const progress = totalBytes > 0 ? Math.min((downloadedBytes / totalBytes) * 100, 99.99) : 0;
          const eta =
            currentSpeed > 0 && totalBytes > 0
              ? Math.max(0, Math.ceil((totalBytes - downloadedBytes) / currentSpeed))
              : null;

          downloadRepository.updateDownload(id, {
            status: "downloading",
            file_path: filePath,
            total_bytes: totalBytes,
            downloaded_bytes: downloadedBytes,
            progress,
            speed_bytes_per_sec: currentSpeed,
            eta_seconds: eta,
            resumable: resumable ? 1 : 0
          });

          this.broadcastDownloadUpdate(id);
          lastPersistTimestamp = now;
        }
      });

      await pipeline(response.data, writer);

      downloadRepository.updateDownload(id, {
        status: "completed",
        file_path: filePath,
        total_bytes: totalBytes || downloadedBytes,
        downloaded_bytes: totalBytes || downloadedBytes,
        progress: 100,
        speed_bytes_per_sec: 0,
        eta_seconds: 0,
        error_message: null,
        completed_at: nowIso(),
        resumable: resumable ? 1 : 0
      });

      downloadRepository.logAction(id, "download_completed", {
        filePath,
        totalBytes: totalBytes || downloadedBytes
      });

      this.broadcastDownloadUpdate(id);
    } catch (error) {
      const snapshot = downloadRepository.getDownloadById(id);

      if (runtime.pauseRequested) {
        downloadRepository.updateDownload(id, {
          status: "paused",
          speed_bytes_per_sec: 0,
          eta_seconds: null,
          error_message: null
        });

        downloadRepository.logAction(id, "download_paused", {
          downloadedBytes: snapshot?.downloaded_bytes || 0
        });
      } else if (runtime.cancelRequested) {
        downloadRepository.updateDownload(id, {
          status: "canceled",
          speed_bytes_per_sec: 0,
          eta_seconds: null,
          error_message: "Download cancelado pelo usuário"
        });

        downloadRepository.logAction(id, "download_canceled", null);
      } else {
        const nextAttempts = Number(snapshot?.attempts || 0) + 1;
        const canRetry = this.isRetryableError(error) && nextAttempts <= settingsService.getMaxAutoRetries();

        if (canRetry) {
          downloadRepository.updateDownload(id, {
            status: "queued",
            attempts: nextAttempts,
            speed_bytes_per_sec: 0,
            eta_seconds: null,
            error_message: `Tentativa ${nextAttempts} falhou: ${error.message}`
          });

          downloadRepository.logAction(id, "download_retry_scheduled", {
            attempt: nextAttempts,
            reason: error.message
          });

          const delay = appConfig.retryDelayMs * nextAttempts;
          setTimeout(() => {
            const latest = downloadRepository.getDownloadById(id);
            if (latest && latest.status === "queued") {
              this.enqueueExisting(id, latest.priority);
              this.processQueue();
            }
          }, delay);
        } else {
          downloadRepository.updateDownload(id, {
            status: "error",
            attempts: nextAttempts,
            speed_bytes_per_sec: 0,
            eta_seconds: null,
            error_message: error.message
          });

          downloadRepository.logError(id, error.message, error.stack);
          downloadRepository.logAction(id, "download_failed", {
            attempts: nextAttempts,
            reason: error.message
          });
        }
      }

      this.broadcastDownloadUpdate(id);
      logger.warn("Falha em download", {
        downloadId: id,
        message: error.message,
        code: error.code
      });
    } finally {
      this.activeTasks.delete(id);
      this.processQueue();
    }
  }

  isRetryableError(error) {
    if (!error) {
      return false;
    }

    const retryableCodes = new Set([
      "ETIMEDOUT",
      "ECONNABORTED",
      "ECONNRESET",
      "EHOSTUNREACH",
      "ENOTFOUND",
      "EPIPE"
    ]);

    if (retryableCodes.has(error.code)) {
      return true;
    }

    if (error.response?.status && retryableStatusCodes.includes(error.response.status)) {
      return true;
    }

    if (typeof error.message === "string") {
      const text = error.message.toLowerCase();
      return text.includes("socket") || text.includes("timeout") || text.includes("network");
    }

    return false;
  }

  broadcastDownloadUpdate(id) {
    const download = downloadRepository.getDownloadById(id);
    if (!download) {
      return;
    }

    realtimeGateway.broadcast("download-updated", download);
    realtimeGateway.broadcast("dashboard-updated", this.getDashboardStats());
  }
}

module.exports = new DownloadManager();
