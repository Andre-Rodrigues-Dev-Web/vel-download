import apiClient from "./apiClient";

export async function fetchDownloads(filters = {}) {
  const response = await apiClient.get("/downloads", { params: filters });
  return response.data.data;
}

export async function createDownload(payload) {
  const response = await apiClient.post("/downloads", payload);
  return response.data.data;
}

export async function pauseDownload(id) {
  const response = await apiClient.post(`/downloads/${id}/pause`);
  return response.data.data;
}

export async function resumeDownload(id) {
  const response = await apiClient.post(`/downloads/${id}/resume`);
  return response.data.data;
}

export async function cancelDownload(id) {
  const response = await apiClient.post(`/downloads/${id}/cancel`);
  return response.data.data;
}

export async function retryDownload(id) {
  const response = await apiClient.post(`/downloads/${id}/retry`);
  return response.data.data;
}

export async function removeDownload(id) {
  const response = await apiClient.delete(`/downloads/${id}`);
  return response.data.data;
}

export async function clearCompletedDownloads() {
  const response = await apiClient.post("/downloads/clear-completed");
  return response.data.data;
}
