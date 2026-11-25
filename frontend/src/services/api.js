import axios from "axios";

// One shared connection to the Django backend.
// The address comes from the .env file, so we never hardcode it.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Send the admin's login token with every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sf_token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

// If the token is no longer valid, sign out and go to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const onLoginPage = window.location.pathname === "/admin/login";
    if (error.response?.status === 401 && !onLoginPage) {
      localStorage.removeItem("sf_token");
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  }
);

// Turns a Django error response into one readable sentence.
export function errorMessage(error) {
  const data = error.response?.data;
  if (!data) return "Can't reach the server. Is the backend running?";
  if (typeof data.detail === "string") return data.detail;
  const first = Object.values(data)[0];
  return Array.isArray(first) ? first[0] : String(first);
}

export default api;
