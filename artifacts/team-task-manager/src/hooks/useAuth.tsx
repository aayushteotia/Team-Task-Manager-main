import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("ttm_token"));
  const [location, setLocation] = useLocation();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  // Clear token on auth error (expired / invalid)
  useEffect(() => {
    if (error) {
      localStorage.removeItem("ttm_token");
      setToken(null);
    }
  }, [error]);

  const isAuthenticated = !!user && !!token;

  // Redirect to dashboard once authenticated (handles post-login navigation)
  useEffect(() => {
    if (isAuthenticated && (location === "/" || location === "/signup")) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, location, setLocation]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem("ttm_token", newToken);
    setToken(newToken);
    // Navigation is handled by the useEffect above once isAuthenticated becomes true
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ttm_token");
    setToken(null);
    setLocation("/");
  }, [setLocation]);

  return {
    user,
    isLoading: isLoading && !!token,
    isAuthenticated,
    login,
    logout,
    isAdmin: user?.role === "admin",
  };
}
