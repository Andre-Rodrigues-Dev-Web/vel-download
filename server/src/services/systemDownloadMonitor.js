const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const settingsService = require("./settingsService");
const downloadManager = require("./downloadManager");
const logger = require("../utils/logger");

const ignoredExtensions = [".crdownload", ".part", ".tmp"];

class SystemDownloadMonitor {
  constructor() {
    this.watcher = null;
  }

  start() {
    const settings = settingsService.getSettings();
    const targetDir = settings.defaultDownloadDir;

    if (!targetDir || !fs.existsSync(targetDir)) {
      logger.warn("Monitor de pasta não iniciado: diretório padrão não encontrado", {
        targetDir
      });
      return;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.watcher = chokidar.watch(targetDir, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1500,
        pollInterval: 100
      },
      depth: 0
    });

    this.watcher.on("add", (filePath) => {
      try {
        const extension = path.extname(filePath).toLowerCase();
        if (ignoredExtensions.includes(extension)) {
          return;
        }

        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
          return;
        }

        const fileName = path.basename(filePath);

        downloadManager.importExternalDownload({
          url: `file://${fileName}`,
          fileName,
          filePath,
          targetDir,
          browserSource: "system",
          sourceReference: "filesystem-watcher",
          status: "completed",
          progress: 100,
          totalBytes: stats.size,
          downloadedBytes: stats.size,
          startedAt: new Date(stats.birthtimeMs || Date.now()).toISOString(),
          completedAt: new Date(stats.mtimeMs || Date.now()).toISOString()
        });
      } catch (error) {
        logger.warn("Falha ao monitorar novo arquivo na pasta de downloads", {
          filePath,
          message: error.message
        });
      }
    });

    logger.info("Monitor de downloads do sistema iniciado", { targetDir });
  }
}

module.exports = new SystemDownloadMonitor();
