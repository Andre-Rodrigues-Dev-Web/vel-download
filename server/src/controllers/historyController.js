const downloadManager = require("../services/downloadManager");
const { toCsv } = require("../utils/csv");
const { asyncHandler } = require("../utils/errors");
const { parseDownloadFilters } = require("./downloadController");

const listHistory = asyncHandler(async (req, res) => {
  const filters = parseDownloadFilters(req.query);
  const data = downloadManager.listDownloads(filters);
  res.json({ success: true, data });
});

const exportHistoryCsv = asyncHandler(async (req, res) => {
  const filters = parseDownloadFilters(req.query);
  const rows = downloadManager.listDownloads(filters);

  const csv = toCsv(rows, [
    { key: "id", label: "ID" },
    { key: "file_name", label: "Arquivo" },
    { key: "url", label: "URL" },
    { key: "browser_source", label: "Origem" },
    { key: "status", label: "Status" },
    { key: "progress", label: "Progresso" },
    { key: "total_bytes", label: "TotalBytes" },
    { key: "downloaded_bytes", label: "BytesBaixados" },
    { key: "created_at", label: "CriadoEm" },
    { key: "completed_at", label: "ConcluidoEm" }
  ]);

  const fileName = `historico-downloads-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-")}.csv`;

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  res.status(200).send(csv);
});

module.exports = {
  listHistory,
  exportHistoryCsv
};
