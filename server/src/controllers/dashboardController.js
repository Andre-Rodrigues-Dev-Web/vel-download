const downloadManager = require("../services/downloadManager");
const { asyncHandler } = require("../utils/errors");

const getDashboard = asyncHandler(async (req, res) => {
  const data = downloadManager.getDashboardStats();
  res.json({ success: true, data });
});

module.exports = {
  getDashboard
};
