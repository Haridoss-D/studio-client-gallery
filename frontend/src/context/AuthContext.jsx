import { createContext, useContext, useState } from "react";
import api, { errorMessage } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("sf_token"));

  // Asks Django to check the username and password.
  async function login(username, password) {
    if (!username || !password) {
      throw new Error("Enter your username and password.");
    }
    try {
      const res = await api.post("/auth/login/", { username, password });
      localStorage.setItem("sf_token", res.data.token);
      setToken(res.data.token);
    } catch (err) {
      throw new Error(errorMessage(err));
    }
  }

  async function logout() {
    try {
      await api.post("/auth/logout/");
    } catch {
      // Even if the server can't be reached, sign out on this device.
    }
    localStorage.removeItem("sf_token");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
