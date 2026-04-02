const extensionApi = globalThis.browser || globalThis.chrome;
const USE_PROMISE_API = typeof globalThis.browser !== "undefined";

const DEFAULTS = {
  appBaseUrl: "http://127.0.0.1:4000",
  extensionToken: "",
  syncBrowserDownloads: true,
  notifyOnSyncError: true,
  defaultCategory: "Extensão",
  defaultPriority: 5
};

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

async function storageGet(keys) {
  return callApi(extensionApi.storage.local.get.bind(extensionApi.storage.local), keys);
}

async function storageSet(payload) {
  return callApi(extensionApi.storage.local.set.bind(extensionApi.storage.local), payload);
}

function setStatus(message, tone = "") {
  const status = document.getElementById("status");
  status.textContent = message || "";
  status.className = tone ? `status ${tone}` : "status";
}

function getFormValues() {
  return {
    appBaseUrl: document.getElementById("appBaseUrl").value.trim().replace(/\/+$/, ""),
    extensionToken: document.getElementById("extensionToken").value.trim(),
    syncBrowserDownloads: document.getElementById("syncBrowserDownloads").checked,
    notifyOnSyncError: document.getElementById("notifyOnSyncError").checked,
    defaultCategory: document.getElementById("defaultCategory").value.trim() || DEFAULTS.defaultCategory,
    defaultPriority: Number(document.getElementById("defaultPriority").value)
  };
}

function fillForm(data) {
  const values = {
    ...DEFAULTS,
    ...(data || {})
  };

  document.getElementById("appBaseUrl").value = values.appBaseUrl;
  document.getElementById("extensionToken").value = values.extensionToken;
  document.getElementById("syncBrowserDownloads").checked = Boolean(values.syncBrowserDownloads);
  document.getElementById("notifyOnSyncError").checked = Boolean(values.notifyOnSyncError);
  document.getElementById("defaultCategory").value = values.defaultCategory;
  document.getElementById("defaultPriority").value = String(values.defaultPriority);
}

function validateConfig(config) {
  try {
    const parsed = new URL(config.appBaseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("A URL da API deve usar http:// ou https://");
    }
  } catch {
    throw new Error("Informe uma URL de API válida. Ex.: http://127.0.0.1:4000");
  }
}

async function loadConfig() {
  const data = await storageGet(Object.keys(DEFAULTS));
  fillForm(data);
}

async function saveConfig() {
  try {
    const values = getFormValues();
    validateConfig(values);

    await storageSet(values);
    setStatus("Configurações salvas com sucesso.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function testConnection() {
  setStatus("Testando conexão com o aplicativo...");

  try {
    const response = await callApi(extensionApi.runtime.sendMessage.bind(extensionApi.runtime), {
      type: "VEL_PING"
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Falha ao conectar com o aplicativo.");
    }

    setStatus("Conexão estabelecida com o Vel Download.", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function bindEvents() {
  document.getElementById("btn-save").addEventListener("click", saveConfig);
  document.getElementById("btn-test").addEventListener("click", testConnection);
}

async function init() {
  bindEvents();
  await loadConfig();
}

init();
