const fs = require("fs");
const path = require("path");
const os = require("os");
const Database = require("better-sqlite3");
const downloadManager = require("./downloadManager");
const logger = require("../utils/logger");

function chromeTimeToIso(value) {
  const micro = Number(value || 0);
  if (!Number.isFinite(micro) || micro <= 0) {
    return null;
  }

  const ms = micro / 1000 - 11644473600000;
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }

  return new Date(ms).toISOString();
}

function firefoxTimeToIso(value) {
  const micro = Number(value || 0);
  if (!Number.isFinite(micro) || micro <= 0) {
    return null;
  }

  return new Date(micro / 1000).toISOString();
}

function decodeFileUri(uri) {
  if (!uri || typeof uri !== "string") {
    return null;
  }

  try {
    const parsed = new URL(uri);
    let pathname = decodeURIComponent(parsed.pathname || "");

    if (process.platform === "win32" && pathname.startsWith("/")) {
      pathname = pathname.slice(1);
    }

    return pathname.replace(/\//g, path.sep);
  } catch {
    return null;
  }
}

function withReadOnlyCopy(dbPath, callback) {
  const tmpFile = path.join(
    os.tmpdir(),
    `vel-download-import-${Date.now()}-${Math.random().toString(16).slice(2)}.sqlite`
  );

  fs.copyFileSync(dbPath, tmpFile);
  const db = new Database(tmpFile, { readonly: true, fileMustExist: true });

  try {
    return callback(db);
  } finally {
    db.close();
    fs.rmSync(tmpFile, { force: true });
  }
}

function getChromeHistoryFiles() {
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) {
    return [];
  }

  const userDataPath = path.join(localAppData, "Google", "Chrome", "User Data");
  if (!fs.existsSync(userDataPath)) {
    return [];
  }

  return fs
    .readdirSync(userDataPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => entry.name === "Default" || entry.name.startsWith("Profile"))
    .map((entry) => path.join(userDataPath, entry.name, "History"))
    .filter((historyPath) => fs.existsSync(historyPath));
}

function getFirefoxHistoryFiles() {
  const appData = process.env.APPDATA;
  if (!appData) {
    return [];
  }

  const profilesPath = path.join(appData, "Mozilla", "Firefox", "Profiles");
  if (!fs.existsSync(profilesPath)) {
    return [];
  }

  return fs
    .readdirSync(profilesPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(profilesPath, entry.name, "places.sqlite"))
    .filter((placesPath) => fs.existsSync(placesPath));
}

function mapChromeState(state, received, total) {
  if (state === 1) {
    return "completed";
  }

  if (state === 2) {
    return "canceled";
  }

  if (state === 3) {
    return "error";
  }

  if (Number(received || 0) > 0 && Number(total || 0) > 0) {
    return "paused";
  }

  return "queued";
}

class BrowserSyncService {
  importChrome(limit = 200) {
    const historyFiles = getChromeHistoryFiles();

    if (!historyFiles.length) {
      return {
        browser: "chrome",
        imported: 0,
        skipped: 0,
        errors: ["Histórico do Chrome não encontrado no sistema."]
      };
    }

    const result = {
      browser: "chrome",
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const historyFile of historyFiles) {
      try {
        const rows = withReadOnlyCopy(historyFile, (db) =>
          db
            .prepare(
              `
              SELECT
                d.id,
                d.target_path,
                d.start_time,
                d.end_time,
                d.total_bytes,
                d.received_bytes,
                d.state,
                (
                  SELECT url
                  FROM downloads_url_chains duc
                  WHERE duc.id = d.id
                  ORDER BY chain_index ASC
                  LIMIT 1
                ) AS source_url
              FROM downloads d
              ORDER BY d.start_time DESC
              LIMIT ?
              `
            )
            .all(limit)
        );

        rows.forEach((row) => {
          const filePath = row.target_path || null;
          const startedAt = chromeTimeToIso(row.start_time);
          const completedAt = chromeTimeToIso(row.end_time);
          const totalBytes = Number(row.total_bytes || 0);
          const downloadedBytes = Number(row.received_bytes || 0);
          const status = mapChromeState(row.state, downloadedBytes, totalBytes);
          const progress = totalBytes > 0 ? Math.min((downloadedBytes / totalBytes) * 100, 100) : 100;

          const importResult = downloadManager.importExternalDownload({
            url: row.source_url || "about:blank",
            filePath,
            browserSource: "chrome",
            sourceReference: `chrome:${row.id}`,
            status,
            progress,
            totalBytes,
            downloadedBytes,
            startedAt,
            completedAt
          });

          if (importResult.imported) {
            result.imported += 1;
          } else {
            result.skipped += 1;
          }
        });
      } catch (error) {
        logger.warn("Falha ao importar histórico do Chrome", {
          file: historyFile,
          message: error.message
        });
        result.errors.push(`Chrome (${historyFile}): ${error.message}`);
      }
    }

    return result;
  }

  importFirefox(limit = 200) {
    const historyFiles = getFirefoxHistoryFiles();

    if (!historyFiles.length) {
      return {
        browser: "firefox",
        imported: 0,
        skipped: 0,
        errors: ["Histórico do Firefox não encontrado no sistema."]
      };
    }

    const result = {
      browser: "firefox",
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const historyFile of historyFiles) {
      try {
        const rows = withReadOnlyCopy(historyFile, (db) =>
          db
            .prepare(
              `
              SELECT
                p.id,
                p.url AS source_url,
                p.last_visit_date,
                a.content AS destination_uri
              FROM moz_places p
              JOIN moz_annos a ON a.place_id = p.id
              JOIN moz_anno_attributes aa ON aa.id = a.anno_attribute_id
              WHERE aa.name = 'downloads/destinationFileURI'
              ORDER BY p.last_visit_date DESC
              LIMIT ?
              `
            )
            .all(limit)
        );

        rows.forEach((row) => {
          const filePath = decodeFileUri(row.destination_uri);
          const startedAt = firefoxTimeToIso(row.last_visit_date);

          const importResult = downloadManager.importExternalDownload({
            url: row.source_url || "about:blank",
            filePath,
            browserSource: "firefox",
            sourceReference: `firefox:${row.id}`,
            status: "completed",
            progress: 100,
            startedAt,
            completedAt: startedAt
          });

          if (importResult.imported) {
            result.imported += 1;
          } else {
            result.skipped += 1;
          }
        });
      } catch (error) {
        logger.warn("Falha ao importar histórico do Firefox", {
          file: historyFile,
          message: error.message
        });
        result.errors.push(`Firefox (${historyFile}): ${error.message}`);
      }
    }

    return result;
  }

  importAll(limit = 200) {
    const chrome = this.importChrome(limit);
    const firefox = this.importFirefox(limit);

    return {
      browser: "all",
      imported: chrome.imported + firefox.imported,
      skipped: chrome.skipped + firefox.skipped,
      errors: [...chrome.errors, ...firefox.errors],
      details: {
        chrome,
        firefox
      }
    };
  }
}

module.exports = new BrowserSyncService();
