const extensionApi = globalThis.browser || globalThis.chrome;
const USE_PROMISE_API = typeof globalThis.browser !== "undefined";

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

      const lastError = globalThis.chrome?.runtime?.lastError?.message;
      if (lastError) {
        settled = true;
        reject(new Error(lastError));
        return;
      }

      settled = true;
      resolve(value);
    };

    try {
      const maybePromise = method(...args, callback);
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise
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

function setStatus(message, tone = "") {
  const element = document.getElementById("status-message");
  element.textContent = message || "";
  element.className = tone ? `status ${tone}` : "status";
}

function setConnectionBadge(text, tone = "") {
  const badge = document.getElementById("connection-badge");
  badge.textContent = text;
  badge.className = tone ? `badge ${tone}` : "badge";
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getPayload() {
  return {
    url: document.getElementById("url").value.trim(),
    fileName: document.getElementById("fileName").value.trim(),
    category: document.getElementById("category").value.trim(),
    priority: Number(document.getElementById("priority").value)
  };
}

async function sendMessage(message) {
  const response = await callApi(extensionApi.runtime.sendMessage.bind(extensionApi.runtime), message);
  if (!response?.ok) {
    throw new Error(response?.error || "Falha na comunicação com a extensão.");
  }

  return response.data;
}

async function prefillActiveTabUrl() {
  try {
    const tabs = await callApi(extensionApi.tabs.query.bind(extensionApi.tabs), {
      active: true,
      currentWindow: true
    });

    const active = tabs?.[0];
    if (!active?.url) {
      return;
    }

    if (validateUrl(active.url)) {
      document.getElementById("url").value = active.url;
    }
  } catch {
    // ignore tab lookup failures
  }
}

async function loadConfigDefaults() {
  try {
    const data = await sendMessage({ type: "VEL_GET_CONFIG" });
    const config = data?.data || {};

    if (config.defaultCategory) {
      document.getElementById("category").value = config.defaultCategory;
    }

    if (config.defaultPriority) {
      document.getElementById("priority").value = String(config.defaultPriority);
    }

    if (config.syncBrowserDownloads === false) {
      setStatus("Sincronização de eventos está desativada nas configurações da extensão.", "error");
    }
  } catch {
    // ignore
  }
}

async function checkConnection() {
  try {
    await sendMessage({ type: "VEL_PING" });
    setConnectionBadge("Conectado", "ok");
  } catch (error) {
    setConnectionBadge("Desconectado", "error");
    setStatus(error.message, "error");
  }
}

async function onStartAppDownload() {
  const payload = getPayload();
  if (!validateUrl(payload.url)) {
    setStatus("Informe uma URL válida para iniciar o download.", "error");
    return;
  }

  setStatus("Enviando download para o Vel Download...");

  try {
    await sendMessage({ type: "VEL_START_APP_DOWNLOAD", payload });
    setStatus("Download enviado para o aplicativo com sucesso.", "ok");
    setConnectionBadge("Conectado", "ok");
  } catch (error) {
    setStatus(error.message, "error");
    setConnectionBadge("Desconectado", "error");
  }
}

async function onStartBrowserDownload() {
  const payload = getPayload();
  if (!validateUrl(payload.url)) {
    setStatus("Informe uma URL válida para baixar no navegador.", "error");
    return;
  }

  setStatus("Iniciando download no navegador e sincronizando...");

  try {
    const result = await sendMessage({ type: "VEL_START_BROWSER_DOWNLOAD", payload });
    setStatus(`Download iniciado no navegador (ID ${result.downloadId}).`, "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function openOptionsPage() {
  await sendMessage({ type: "VEL_OPEN_OPTIONS" });
}

function bindEvents() {
  document.getElementById("btn-app").addEventListener("click", onStartAppDownload);
  document.getElementById("btn-browser").addEventListener("click", onStartBrowserDownload);
  document.getElementById("btn-options").addEventListener("click", openOptionsPage);
}

async function init() {
  bindEvents();
  await Promise.all([prefillActiveTabUrl(), loadConfigDefaults(), checkConnection()]);
}

init();
