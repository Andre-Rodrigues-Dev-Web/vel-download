const path = require("path");

function sanitizeFileName(name = "arquivo") {
  return name
    .replace(/[<>:"/\\|?*]+/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFileNameFromUrl(fileUrl, fallbackName = "download.bin") {
  try {
    const url = new URL(fileUrl);
    const fromPath = decodeURIComponent(path.basename(url.pathname || ""));
    const value = sanitizeFileName(fromPath || fallbackName);
    return value || fallbackName;
  } catch {
    return fallbackName;
  }
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return fallback;
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  sanitizeFileName,
  buildFileNameFromUrl,
  parseBoolean,
  parseNumber
};
