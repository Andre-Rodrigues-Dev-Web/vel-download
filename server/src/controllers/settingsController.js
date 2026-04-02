const settingsService = require("../services/settingsService");
const { asyncHandler } = require("../utils/errors");

const getSettings = asyncHandler(async (req, res) => {
  const data = settingsService.getSettings();
  res.json({ success: true, data });
});

const updateSettings = asyncHandler(async (req, res) => {
  const data = settingsService.updateSettings(req.body);
  res.json({ success: true, data });
});

module.exports = {
  getSettings,
  updateSettings
};
