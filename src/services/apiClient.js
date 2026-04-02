import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message || error?.message || "Falha ao comunicar com a API local";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
