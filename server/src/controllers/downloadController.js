const downloadManager = require("../services/downloadManager");
const { asyncHandler, AppError } = require("../utils/errors");

function parseDownloadFilters(query = {}) {
  return {
    search: query.search || "",
    status: query.status || "",
    browser: query.browser || "",
    startDate: query.startDate || "",
    endDate: query.endDate || "",
    sort: query.sort || "newest"
  };
}

const listDownloads = asyncHandler(async (req, res) => {
  const items = downloadManager.listDownloads(parseDownloadFilters(req.query));
  res.json({ success: true, data: items });
});

const createDownload = asyncHandler(async (req, res) => {
  const created = downloadManager.createDownload(req.body);
  res.status(201).json({ success: true, data: created });
});

function getId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("ID de download inválido", 400);
  }

  return id;
}

const pauseDownload = asyncHandler(async (req, res) => {
  const data = downloadManager.pauseDownload(getId(req.params.id));
  res.json({ success: true, data });
});

const resumeDownload = asyncHandler(async (req, res) => {
  const data = downloadManager.resumeDownload(getId(req.params.id));
  res.json({ success: true, data });
});

const cancelDownload = asyncHandler(async (req, res) => {
  const data = downloadManager.cancelDownload(getId(req.params.id));
  res.json({ success: true, data });
});

const retryDownload = asyncHandler(async (req, res) => {
  const data = downloadManager.retryDownload(getId(req.params.id));
  res.json({ success: true, data });
});

const removeDownload = asyncHandler(async (req, res) => {
  const data = downloadManager.removeDownloadFromHistory(getId(req.params.id));
  res.json({ success: true, data });
});

const clearCompleted = asyncHandler(async (req, res) => {
  const data = downloadManager.clearCompletedHistory();
  res.json({ success: true, data });
});

module.exports = {
  listDownloads,
  createDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  retryDownload,
  removeDownload,
  clearCompleted,
  parseDownloadFilters
};
