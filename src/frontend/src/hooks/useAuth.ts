import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const AUTH_STORAGE_KEY = "vk_auth";
const VALID_USERNAME = "vagesh";
const VALID_PASSWORD = "vk888";

interface AuthContextValue {
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

import { type ReactNode, createElement } from "react";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isLoggedIn) {
        localStorage.setItem(AUTH_STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {
      // localStorage may be unavailable in some environments
    }
  }, [isLoggedIn]);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { isLoggedIn, login, logout } },
    children,
  );
}
