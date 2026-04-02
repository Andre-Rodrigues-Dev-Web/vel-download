import apiClient from "./apiClient";

export async function fetchSettings() {
  const response = await apiClient.get("/settings");
  return response.data.data;
}

export async function updateSettings(payload) {
  const response = await apiClient.put("/settings", payload);
  return response.data.data;
}
