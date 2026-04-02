import apiClient from "./apiClient";

export async function importBrowserHistory(browser = "all", limit = 200) {
  const response = await apiClient.post("/browser/import", { browser, limit });
  return response.data.data;
}

export async function fetchBrowserLimitations() {
  const response = await apiClient.get("/browser/limitations");
  return response.data.data;
}
