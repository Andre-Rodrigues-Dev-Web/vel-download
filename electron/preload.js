const { contextBridge, ipcRenderer } = require("electron");

function safeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

contextBridge.exposeInMainWorld("desktopAPI", {
  selectDirectory: () => ipcRenderer.invoke("dialog:select-directory"),
  openPath: (targetPath) => ipcRenderer.invoke("shell:open-path", safeString(targetPath)),
  showItemInFolder: (targetPath) =>
    ipcRenderer.invoke("shell:show-item-in-folder", safeString(targetPath)),
  notify: (payload) => ipcRenderer.send("notification:show", payload || {}),
  getLaunchOnStartup: () => ipcRenderer.invoke("app:get-launch-on-startup"),
  setLaunchOnStartup: (enabled) => ipcRenderer.invoke("app:set-launch-on-startup", Boolean(enabled)),
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  shouldUseDarkTheme: () => ipcRenderer.invoke("theme:should-use-dark")
});
