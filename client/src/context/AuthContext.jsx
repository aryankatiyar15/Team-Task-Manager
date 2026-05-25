import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { request } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("ttm_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await request("/auth/me");
        setUser(data.user);
      } catch (_error) {
        localStorage.removeItem("ttm_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function login(credentials) {
    const data = await request("/auth/login", {
      method: "POST",
      body: credentials
    });

    localStorage.setItem("ttm_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(payload) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: payload
    });

    localStorage.setItem("ttm_token", data.token);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch (_error) {
      // JWT logout is client-side; the API call is best-effort for demo clarity.
    }

    localStorage.removeItem("ttm_token");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "Admin",
      login,
      logout,
      signup
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
