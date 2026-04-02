import apiClient, { API_BASE_URL } from "./apiClient";

export async function fetchHistory(filters = {}) {
  const response = await apiClient.get("/history", { params: filters });
  return response.data.data;
}

export function getHistoryExportUrl(filters = {}) {
  const url = new URL(`${API_BASE_URL}/api/history/export.csv`);

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
