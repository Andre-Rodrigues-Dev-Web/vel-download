import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE_URL } from "../services/apiClient";
import {
  cancelDownload,
  clearCompletedDownloads,
  createDownload,
  fetchDownloads,
  pauseDownload,
  removeDownload,
  resumeDownload,
  retryDownload
} from "../services/downloadService";
import { fetchDashboard } from "../services/dashboardService";
import { fetchSettings, updateSettings as updateSettingsRequest } from "../services/settingsService";
import { importBrowserHistory } from "../services/browserService";
import { notifyCompletion } from "../services/desktopService";

const initialDashboard = {
  activeCount: 0,
  completedCount: 0,
  pausedCount: 0,
  errorCount: 0,
  currentSpeed: 0,
  usedSpace: 0,
  totalDownloads: 0
};

const initialSettings = {
  defaultDownloadDir: "",
  maxConcurrentDownloads: 3,
  maxAutoRetries: 3,
  theme: "dark",
  launchOnStartup: false,
  completionNotifications: true,
  autoCleanupDays: 90
};

const AppContext = createContext(null);

function sortDownloads(items) {
  return [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

function upsertDownload(list, item) {
  const index = list.findIndex((entry) => entry.id === item.id);
  if (index === -1) {
    return sortDownloads([item, ...list]);
  }

  const clone = [...list];
  clone[index] = item;
  return sortDownloads(clone);
}

export function AppProvider({ children }) {
  const [downloads, setDownloads] = useState([]);
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const settingsRef = useRef(settings);
  const notifiedCompletedIds = useRef(new Set());

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const runSafe = useCallback(async (handler, defaultMessage) => {
    try {
      const result = await handler();
      setErrorMessage("");
      return result;
    } catch (error) {
      setErrorMessage(error.message || defaultMessage);
      throw error;
    }
  }, []);

  const loadDownloads = useCallback(async () => {
    const items = await fetchDownloads({ sort: "newest" });
    setDownloads(sortDownloads(items));
    return items;
  }, []);

  const loadDashboard = useCallback(async () => {
    const stats = await fetchDashboard();
    setDashboard(stats);
    return stats;
  }, []);

  const loadSettings = useCallback(async () => {
    const data = await fetchSettings();
    setSettings(data);
    return data;
  }, []);

  const reloadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDownloads(), loadDashboard(), loadSettings()]);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error.message || "Falha ao carregar dados iniciais");
    } finally {
      setLoading(false);
    }
  }, [loadDashboard, loadDownloads, loadSettings]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  useEffect(() => {
    const source = new EventSource(`${API_BASE_URL}/api/events`);

    source.addEventListener("connected", () => {
      setRealtimeConnected(true);
    });

    source.addEventListener("download-updated", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setDownloads((prev) => upsertDownload(prev, payload));

        if (
          payload.status === "completed" &&
          settingsRef.current.completionNotifications &&
          !notifiedCompletedIds.current.has(payload.id)
        ) {
          notifiedCompletedIds.current.add(payload.id);
          notifyCompletion("Download concluído", payload.file_name || "Arquivo concluído");
        }
      } catch {
        // ignore invalid payload
      }
    });

    source.addEventListener("dashboard-updated", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setDashboard(payload);
      } catch {
        // ignore invalid payload
      }
    });

    source.addEventListener("settings-updated", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setSettings(payload);
      } catch {
        // ignore invalid payload
      }
    });

    source.addEventListener("history-updated", () => {
      loadDownloads().catch(() => {
        // no-op
      });
    });

    source.onerror = () => {
      setRealtimeConnected(false);
    };

    return () => {
      source.close();
      setRealtimeConnected(false);
    };
  }, [loadDownloads]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboard().catch(() => {
        // no-op
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [loadDashboard]);

  const actions = useMemo(
    () => ({
      reloadAll,
      loadDownloads,
      loadDashboard,
      loadSettings,
      async addDownload(payload) {
        await runSafe(() => createDownload(payload), "Falha ao iniciar download");
      },
      async pause(id) {
        await runSafe(() => pauseDownload(id), "Falha ao pausar download");
      },
      async resume(id) {
        await runSafe(() => resumeDownload(id), "Falha ao retomar download");
      },
      async cancel(id) {
        await runSafe(() => cancelDownload(id), "Falha ao cancelar download");
      },
      async retry(id) {
        await runSafe(() => retryDownload(id), "Falha ao reprocessar download");
      },
      async remove(id) {
        await runSafe(() => removeDownload(id), "Falha ao remover histórico");
        await loadDownloads();
        await loadDashboard();
      },
      async clearCompleted() {
        await runSafe(() => clearCompletedDownloads(), "Falha ao limpar concluídos");
        await loadDownloads();
        await loadDashboard();
      },
      async saveSettings(payload) {
        const updated = await runSafe(
          () => updateSettingsRequest(payload),
          "Falha ao salvar configurações"
        );
        setSettings(updated);
        return updated;
      },
      async importBrowser(browser) {
        const result = await runSafe(
          () => importBrowserHistory(browser),
          "Falha ao importar histórico do navegador"
        );
        await loadDownloads();
        await loadDashboard();
        return result;
      }
    }),
    [loadDashboard, loadDownloads, loadSettings, reloadAll, runSafe]
  );

  const value = {
    downloads,
    dashboard,
    settings,
    loading,
    errorMessage,
    realtimeConnected,
    ...actions
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext deve ser usado dentro do AppProvider");
  }

  return context;
}
