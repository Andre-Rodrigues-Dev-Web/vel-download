const extensionApi = globalThis.browser || globalThis.chrome;
const USE_PROMISE_API = typeof globalThis.browser !== "undefined";

const DEFAULT_CONFIG = {
  appBaseUrl: "http://127.0.0.1:4000",
  extensionToken: "",
  syncBrowserDownloads: true,
  notifyOnSyncError: true,
  defaultCategory: "Extensão",
  defaultPriority: 5
};

const LAST_SYNC_CACHE = new Map();
const DOWNLOAD_MEMORY = new Map();
const MIN_SYNC_INTERVAL_MS = 450;

function detectBrowser() {
  if (typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent || "")) {
    return "firefox";
  }

  return "chrome";
}

const BROWSER = detectBrowser();

function normalizeBaseUrl(value) {
  const fallback = DEFAULT_CONFIG.appBaseUrl;
  const text = String(value || fallback).trim().replace(/\/+$/, "");
  return text || fallback;
}

function buildPathFragment(filePath) {
  if (!filePath) {
    return "";
  }

  const normalized = String(filePath).replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function runtimeLastErrorMessage() {
  return globalThis.chrome?.runtime?.lastError?.message || "";
}

function callApi(method, ...args) {
  if (USE_PROMISE_API) {
    try {
      return Promise.resolve(method(...args));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const callback = (value) => {
      if (settled) {
        return;
      }

      const lastError = runtimeLastErrorMessage();
      if (lastError) {
        settled = true;
        reject(new Error(lastError));
        return;
      }

      settled = true;
      resolve(value);
    };

    try {
      const possiblePromise = method(...args, callback);
      if (possiblePromise && typeof possiblePromise.then === "function") {
        possiblePromise
          .then((value) => {
            if (!settled) {
              settled = true;
              resolve(value);
            }
          })
          .catch((error) => {
            if (!settled) {
              settled = true;
              reject(error);
            }
          });
      }
    } catch (error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
    }
  });
}

async function storageGet(keys) {
  return callApi(extensionApi.storage.local.get.bind(extensionApi.storage.local), keys);
}

async function storageSet(payload) {
  return callApi(extensionApi.storage.local.set.bind(extensionApi.storage.local), payload);
}

async function ensureDefaultConfig() {
  const existing = await storageGet(Object.keys(DEFAULT_CONFIG));
  const missing = {};

  Object.entries(DEFAULT_CONFIG).forEach(([key, value]) => {
    if (existing[key] === undefined) {
      missing[key] = value;
    }
  });

  if (Object.keys(missing).length) {
    await storageSet(missing);
  }
}

async function getConfig() {
  await ensureDefaultConfig();
  const data = await storageGet(Object.keys(DEFAULT_CONFIG));

  return {
    ...DEFAULT_CONFIG,
    ...data,
    appBaseUrl: normalizeBaseUrl(data.appBaseUrl)
  };
}

async function notifyError(title, message) {
  const config = await getConfig();
  if (!config.notifyOnSyncError) {
    return;
  }

  console.warn(`[Vel Download Bridge] ${title}: ${message}`);

  try {
    await callApi(extensionApi.action.setBadgeText.bind(extensionApi.action), { text: "!" });
    await callApi(extensionApi.action.setBadgeBackgroundColor.bind(extensionApi.action), {
      color: "#ef4444"
    });
    await callApi(extensionApi.action.setTitle.bind(extensionApi.action), {
      title: `${title}: ${message}`
    });
  } catch {
    // ignore badge failures
  }
}

async function clearBadge() {
  try {
    await callApi(extensionApi.action.setBadgeText.bind(extensionApi.action), { text: "" });
    await callApi(extensionApi.action.setTitle.bind(extensionApi.action), {
      title: "Vel Download"
    });
  } catch {
    // ignore
  }
}

function normalizeDownloadItem(item) {
  const downloadId = item.downloadId ?? item.id;
  const filePath = item.filePath || item.filename || "";

  return {
    downloadId: String(downloadId),
    url: item.url || "",
    finalUrl: item.finalUrl || "",
    filePath,
    fileName: item.fileName || buildPathFragment(filePath),
    bytesReceived: Number(item.bytesReceived || 0),
    totalBytes: Number(item.totalBytes || 0),
    state: item.state || "in_progress",
    paused: Boolean(item.paused),
    error: item.error || "",
    startTime: item.startTime || "",
    endTime: item.endTime || "",
    canResume: Boolean(item.canResume)
  };
}

function rememberDownloadItem(item) {
  const normalized = normalizeDownloadItem(item || {});
  const key = String(normalized.downloadId || "");
  if (!key) {
    return normalized;
  }

  const previous = DOWNLOAD_MEMORY.get(key) || {};
  const merged = {
    ...previous,
    ...normalized,
    url: normalized.url || previous.url || "",
    finalUrl: normalized.finalUrl || previous.finalUrl || "",
    filePath: normalized.filePath || previous.filePath || "",
    fileName: normalized.fileName || previous.fileName || ""
  };

  DOWNLOAD_MEMORY.set(key, merged);

  if (DOWNLOAD_MEMORY.size > 1000) {
    const oldestKey = DOWNLOAD_MEMORY.keys().next().value;
    if (oldestKey) {
      DOWNLOAD_MEMORY.delete(oldestKey);
    }
  }

  return merged;
}

async function appRequest(path, payload) {
  const config = await getConfig();

  const headers = {
    "Content-Type": "application/json"
  };

  if (config.extensionToken) {
    headers["x-extension-token"] = config.extensionToken;
  }

  const response = await fetch(`${config.appBaseUrl}${path}`, {
    method: payload ? "POST" : "GET",
    headers,
    body: payload ? JSON.stringify(payload) : undefined
  });

  const text = await response.text();
  let json = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    const message = json?.message || `Falha HTTP ${response.status}`;
    throw new Error(message);
  }

  return json;
}

function buildSyncKey(eventType, item) {
  return `${eventType}:${item.downloadId}:${item.state}:${item.bytesReceived}:${item.totalBytes}:${item.paused}:${item.error}`;
}

function shouldSync(eventType, normalizedItem) {
  if (eventType === "created" || eventType === "erased" || eventType === "manual-start") {
    return true;
  }

  const now = Date.now();
  const key = String(normalizedItem.downloadId);
  const signature = buildSyncKey(eventType, normalizedItem);
  const previous = LAST_SYNC_CACHE.get(key);

  if (!previous) {
    LAST_SYNC_CACHE.set(key, { signature, timestamp: now });
    return true;
  }

  if (previous.signature !== signature) {
    LAST_SYNC_CACHE.set(key, { signature, timestamp: now });
    return true;
  }

  if (now - previous.timestamp >= MIN_SYNC_INTERVAL_MS) {
    LAST_SYNC_CACHE.set(key, { signature, timestamp: now });
    return true;
  }

  return false;
}

async function sendDownloadEvent(eventType, item) {
  const config = await getConfig();
  if (!config.syncBrowserDownloads) {
    return { success: true, skipped: true };
  }

  const normalizedItem = rememberDownloadItem(item);

  if (!shouldSync(eventType, normalizedItem)) {
    return { success: true, skipped: true };
  }

  try {
    const response = await appRequest("/api/browser/extension/event", {
      browser: BROWSER,
      eventType,
      item: normalizedItem
    });
    await clearBadge();
    return response;
  } catch (error) {
    await notifyError("Falha ao sincronizar download", error.message);
    return { success: false, error: error.message };
  }
}

async function fetchDownloadSnapshot(downloadId) {
  const id = Number(downloadId);
  const items = await callApi(extensionApi.downloads.search.bind(extensionApi.downloads), { id });
  return items?.[0] || null;
}

async function startBrowserDownload(payload) {
  const downloadId = await callApi(extensionApi.downloads.download.bind(extensionApi.downloads), {
    url: payload.url,
    filename: payload.fileName || undefined,
    saveAs: false
  });

  const snapshot = await fetchDownloadSnapshot(downloadId);
  if (snapshot) {
    await sendDownloadEvent("manual-start", snapshot);
  }

  return { downloadId };
}

async function startAppDownload(payload) {
  const config = await getConfig();
  const response = await appRequest("/api/browser/extension/download", {
    browser: BROWSER,
    url: payload.url,
    fileName: payload.fileName || "",
    category: payload.category || config.defaultCategory,
    priority: Number(payload.priority || config.defaultPriority)
  });
  await clearBadge();
  return response;
}

async function pingApp() {
  const response = await appRequest("/api/browser/extension/ping");
  await clearBadge();
  return response;
}

function fallbackFromDelta(delta) {
  return {
    downloadId: delta.id,
    state: delta.state?.current || "in_progress",
    paused: Boolean(delta.paused?.current),
    bytesReceived: Number(delta.bytesReceived?.current || 0),
    totalBytes: Number(delta.totalBytes?.current || 0),
    filePath: delta.filename?.current || "",
    error: delta.error?.current || "",
    endTime: new Date().toISOString(),
    canResume: Boolean(delta.canResume?.current)
  };
}

extensionApi.downloads.onCreated.addListener((item) => {
  sendDownloadEvent("created", item);
});

extensionApi.downloads.onChanged.addListener(async (delta) => {
  try {
    const snapshot = await fetchDownloadSnapshot(delta.id);
    const payload = snapshot || fallbackFromDelta(delta);
    await sendDownloadEvent("changed", payload);
  } catch (error) {
    await notifyError("Falha ao ler download", error.message);
  }
});

extensionApi.downloads.onErased.addListener((downloadId) => {
  sendDownloadEvent("erased", {
    downloadId,
    state: "interrupted",
    error: "ERASED_BY_USER"
  });
  DOWNLOAD_MEMORY.delete(String(downloadId));
});

extensionApi.runtime.onInstalled.addListener(() => {
  ensureDefaultConfig();
});

extensionApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const safeMessage = message || {};

  const handle = async () => {
    if (safeMessage.type === "VEL_PING") {
      return pingApp();
    }

    if (safeMessage.type === "VEL_START_APP_DOWNLOAD") {
      return startAppDownload(safeMessage.payload || {});
    }

    if (safeMessage.type === "VEL_START_BROWSER_DOWNLOAD") {
      return startBrowserDownload(safeMessage.payload || {});
    }

    if (safeMessage.type === "VEL_OPEN_OPTIONS") {
      await callApi(extensionApi.runtime.openOptionsPage.bind(extensionApi.runtime));
      return { success: true };
    }

    if (safeMessage.type === "VEL_GET_CONFIG") {
      const config = await getConfig();
      return { success: true, data: config };
    }

    throw new Error("Ação não suportada.");
  };

  handle()
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

ensureDefaultConfig();
