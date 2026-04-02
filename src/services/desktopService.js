function getDesktopApi() {
  if (typeof window !== "undefined" && window.desktopAPI) {
    return window.desktopAPI;
  }

  return null;
}

export async function selectDirectory() {
  const api = getDesktopApi();
  if (!api?.selectDirectory) {
    return null;
  }

  return api.selectDirectory();
}

export async function openPath(targetPath) {
  const api = getDesktopApi();
  if (!api?.openPath) {
    return { ok: false, message: "Recurso disponível apenas no app desktop" };
  }

  return api.openPath(targetPath);
}

export async function showItemInFolder(targetPath) {
  const api = getDesktopApi();
  if (!api?.showItemInFolder) {
    return { ok: false, message: "Recurso disponível apenas no app desktop" };
  }

  return api.showItemInFolder(targetPath);
}

export async function setLaunchOnStartup(enabled) {
  const api = getDesktopApi();
  if (!api?.setLaunchOnStartup) {
    return false;
  }

  return api.setLaunchOnStartup(Boolean(enabled));
}

export async function getLaunchOnStartup() {
  const api = getDesktopApi();
  if (!api?.getLaunchOnStartup) {
    return false;
  }

  return api.getLaunchOnStartup();
}

export function notifyCompletion(title, body) {
  const api = getDesktopApi();
  if (api?.notify) {
    api.notify({ title, body });
    return;
  }

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

export function desktopAvailable() {
  return Boolean(getDesktopApi());
}
