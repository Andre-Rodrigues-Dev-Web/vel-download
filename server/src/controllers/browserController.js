const browserSyncService = require("../services/browserSyncService");
const browserExtensionService = require("../services/browserExtensionService");
const { asyncHandler } = require("../utils/errors");

const importBrowserHistory = asyncHandler(async (req, res) => {
  const browser = String(req.body?.browser || "all").toLowerCase();
  const limit = Number(req.body?.limit || 200);

  let result;

  if (browser === "chrome") {
    result = browserSyncService.importChrome(limit);
  } else if (browser === "firefox") {
    result = browserSyncService.importFirefox(limit);
  } else {
    result = browserSyncService.importAll(limit);
  }

  res.json({ success: true, data: result });
});

const getIntegrationLimitations = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      limitations: [
        "O app importa histórico local dos navegadores, mas não controla nativamente a fila interna do Chrome/Firefox.",
        "Alguns perfis podem estar bloqueados se o navegador estiver em uso intenso; o app usa cópia segura dos bancos quando possível.",
        "Nem todo registro traz URL final ou metadata completa; nesses casos o sistema preserva o que estiver disponível.",
        "Pausar/retomar downloads importados só é possível quando o download for reexecutado pelo próprio Vel Download.",
        "A extensão sincroniza eventos de download, mas não substitui as permissões internas de segurança do navegador."
      ]
    }
  });
});

const enqueueByExtension = asyncHandler(async (req, res) => {
  const data = browserExtensionService.createDownloadFromExtension(req.body);
  res.status(201).json({ success: true, data });
});

const ingestExtensionEvent = asyncHandler(async (req, res) => {
  const data = browserExtensionService.ingestEvent(req.body);
  res.json({ success: true, data });
});

const extensionPing = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      status: "connected",
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = {
  importBrowserHistory,
  getIntegrationLimitations,
  enqueueByExtension,
  ingestExtensionEvent,
  extensionPing
};
