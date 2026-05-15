import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";

interface AuthContextValue {
  user: ReturnType<typeof useGetMe>["data"];
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("ttm_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      localStorage.removeItem("ttm_token");
      setToken(null);
    }
  }, [error]);

  const isAuthenticated = !!user && !!token;

  const login = useCallback((newToken: string) => {
    localStorage.setItem("ttm_token", newToken);
    setToken(newToken);
    setLocation("/dashboard");
  }, [setLocation]);

  const logout = useCallback(() => {
    localStorage.removeItem("ttm_token");
    setToken(null);
    queryClient.removeQueries();
    setLocation("/");
  }, [setLocation]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading: isLoading && !!token,
      isAuthenticated,
      isAdmin: user?.role === "admin",
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
