const { getDb } = require("./database");
const { validSortOptions } = require("../config");

function mapRow(row) {
  if (!row) {
    return row;
  }

  return {
    ...row,
    resumable: Boolean(row.resumable)
  };
}

function ensureCategory(categoryName) {
  if (!categoryName) {
    return;
  }

  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO categories(name) VALUES (?)").run(categoryName);
}

function createDownload(payload) {
  const db = getDb();
  ensureCategory(payload.category);

  const statement = db.prepare(`
    INSERT INTO downloads (
      url,
      file_name,
      target_dir,
      file_path,
      category,
      priority,
      browser_source,
      status,
      progress,
      total_bytes,
      downloaded_bytes,
      speed_bytes_per_sec,
      eta_seconds,
      started_at,
      completed_at,
      error_message,
      attempts,
      resumable,
      source_reference
    ) VALUES (
      @url,
      @file_name,
      @target_dir,
      @file_path,
      @category,
      @priority,
      @browser_source,
      @status,
      @progress,
      @total_bytes,
      @downloaded_bytes,
      @speed_bytes_per_sec,
      @eta_seconds,
      @started_at,
      @completed_at,
      @error_message,
      @attempts,
      @resumable,
      @source_reference
    )
  `);

  const result = statement.run({
    url: payload.url,
    file_name: payload.fileName,
    target_dir: payload.targetDir,
    file_path: payload.filePath || null,
    category: payload.category || null,
    priority: payload.priority ?? 5,
    browser_source: payload.browserSource || "app",
    status: payload.status || "queued",
    progress: payload.progress ?? 0,
    total_bytes: payload.totalBytes ?? 0,
    downloaded_bytes: payload.downloadedBytes ?? 0,
    speed_bytes_per_sec: payload.speed ?? 0,
    eta_seconds: payload.etaSeconds ?? null,
    started_at: payload.startedAt || null,
    completed_at: payload.completedAt || null,
    error_message: payload.errorMessage || null,
    attempts: payload.attempts ?? 0,
    resumable: payload.resumable ? 1 : 0,
    source_reference: payload.sourceReference || null
  });

  return getDownloadById(result.lastInsertRowid);
}

function getDownloadById(id) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM downloads WHERE id = ?").get(id);
  return mapRow(row);
}

function listDownloads(filters = {}) {
  const db = getDb();
  const clauses = [];
  const values = [];

  if (filters.search) {
    clauses.push("(file_name LIKE ? OR url LIKE ? OR IFNULL(category, '') LIKE ?)");
    const term = `%${filters.search}%`;
    values.push(term, term, term);
  }

  if (filters.status) {
    clauses.push("status = ?");
    values.push(filters.status);
  }

  if (filters.browser) {
    clauses.push("browser_source = ?");
    values.push(filters.browser);
  }

  if (filters.startDate) {
    clauses.push("datetime(created_at) >= datetime(?)");
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push("datetime(created_at) <= datetime(?)");
    values.push(filters.endDate);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const sortMap = {
    newest: "created_at DESC",
    oldest: "created_at ASC",
    largest: "total_bytes DESC",
    smallest: "total_bytes ASC"
  };

  const sort = validSortOptions.includes(filters.sort) ? filters.sort : "newest";
  const orderBy = sortMap[sort];

  const rows = db
    .prepare(`SELECT * FROM downloads ${whereSql} ORDER BY ${orderBy}`)
    .all(...values)
    .map(mapRow);

  return rows;
}

function updateDownload(id, changes) {
  const keys = Object.keys(changes || {});
  if (!keys.length) {
    return getDownloadById(id);
  }

  if (Object.prototype.hasOwnProperty.call(changes, "category")) {
    ensureCategory(changes.category);
  }

  const db = getDb();
  const setClause = keys.map((key) => `${key} = @${key}`).join(", ");
  const statement = db.prepare(`UPDATE downloads SET ${setClause} WHERE id = @id`);
  statement.run({ id, ...changes });
  return getDownloadById(id);
}

function updateManyByStatus(status, changes) {
  const keys = Object.keys(changes || {});
  if (!keys.length) {
    return;
  }

  const db = getDb();
  const setClause = keys.map((key) => `${key} = @${key}`).join(", ");
  db.prepare(`UPDATE downloads SET ${setClause} WHERE status = @status`).run({
    ...changes,
    status
  });
}

function removeDownload(id) {
  const db = getDb();
  return db.prepare("DELETE FROM downloads WHERE id = ?").run(id);
}

function clearCompletedDownloads() {
  const db = getDb();
  return db.prepare("DELETE FROM downloads WHERE status = 'completed'").run();
}

function logAction(downloadId, action, metadata = null) {
  const db = getDb();
  db.prepare(
    "INSERT INTO action_history(download_id, action, metadata) VALUES (?, ?, ?)"
  ).run(downloadId || null, action, metadata ? JSON.stringify(metadata) : null);
}

function logError(downloadId, message, stack = null) {
  const db = getDb();
  db.prepare(
    "INSERT INTO error_logs(download_id, message, stack) VALUES (?, ?, ?)"
  ).run(downloadId || null, message, stack);
}

function getDashboardStats() {
  const db = getDb();

  const row = db
    .prepare(`
      SELECT
        SUM(CASE WHEN status = 'downloading' THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) AS paused_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS error_count,
        SUM(CASE WHEN status = 'downloading' THEN speed_bytes_per_sec ELSE 0 END) AS current_speed,
        SUM(CASE WHEN status = 'completed' THEN total_bytes ELSE downloaded_bytes END) AS used_space,
        COUNT(*) AS total_downloads
      FROM downloads
    `)
    .get();

  return {
    activeCount: Number(row?.active_count || 0),
    completedCount: Number(row?.completed_count || 0),
    pausedCount: Number(row?.paused_count || 0),
    errorCount: Number(row?.error_count || 0),
    currentSpeed: Number(row?.current_speed || 0),
    usedSpace: Number(row?.used_space || 0),
    totalDownloads: Number(row?.total_downloads || 0)
  };
}

function findByFilePath(filePath) {
  if (!filePath) {
    return null;
  }

  const db = getDb();
  return mapRow(db.prepare("SELECT * FROM downloads WHERE file_path = ?").get(filePath));
}

function findBySourceReference(sourceReference) {
  if (!sourceReference) {
    return null;
  }

  const db = getDb();
  return mapRow(
    db.prepare("SELECT * FROM downloads WHERE source_reference = ? LIMIT 1").get(sourceReference)
  );
}

function findExistingImported({ url, filePath, browserSource, fileName }) {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT *
      FROM downloads
      WHERE browser_source = ?
        AND (
          (file_path IS NOT NULL AND file_path = ?)
          OR (url = ? AND IFNULL(file_name, '') = IFNULL(?, ''))
        )
      LIMIT 1
      `
    )
    .get(browserSource, filePath || null, url || "", fileName || null);

  return mapRow(row);
}

function listCategories() {
  const db = getDb();
  return db.prepare("SELECT * FROM categories ORDER BY name ASC").all();
}

module.exports = {
  createDownload,
  getDownloadById,
  listDownloads,
  updateDownload,
  updateManyByStatus,
  removeDownload,
  clearCompletedDownloads,
  logAction,
  logError,
  getDashboardStats,
  findByFilePath,
  findBySourceReference,
  findExistingImported,
  listCategories
};
