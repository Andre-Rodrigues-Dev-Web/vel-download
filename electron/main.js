const path = require("path");
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  Notification,
  nativeTheme
} = require("electron");

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#0b1220",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev
    }
  });

  if (isDev) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL || "http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  return mainWindow;
}

function setupIpc() {
  ipcMain.handle("dialog:select-directory", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"]
    });

    if (canceled || !filePaths.length) {
      return null;
    }

    return filePaths[0];
  });

  ipcMain.handle("shell:open-path", async (_event, targetPath) => {
    if (typeof targetPath !== "string" || !targetPath.trim()) {
      return { ok: false, message: "Caminho inválido" };
    }

    const error = await shell.openPath(targetPath);
    return { ok: !error, message: error || null };
  });

  ipcMain.handle("shell:show-item-in-folder", async (_event, targetPath) => {
    if (typeof targetPath !== "string" || !targetPath.trim()) {
      return { ok: false, message: "Caminho inválido" };
    }

    shell.showItemInFolder(targetPath);
    return { ok: true };
  });

  ipcMain.handle("app:get-launch-on-startup", () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle("app:set-launch-on-startup", (_event, enabled) => {
    const shouldEnable = Boolean(enabled);
    app.setLoginItemSettings({ openAtLogin: shouldEnable });
    return shouldEnable;
  });

  ipcMain.handle("app:get-version", () => app.getVersion());

  ipcMain.on("notification:show", (_event, payload) => {
    if (!Notification.isSupported()) {
      return;
    }

    const title = payload?.title || "Vel Download";
    const body = payload?.body || "Notificação";

    new Notification({ title, body }).show();
  });

  ipcMain.handle("theme:should-use-dark", () => nativeTheme.shouldUseDarkColors);
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.vel.download");
  setupIpc();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
