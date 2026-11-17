import { jwtDecode } from "jwt-decode";
import { CONFIG } from "./config";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  exp?: number;
}

export const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
};

export const getRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

  if (!token || token === "undefined" || token === "null") {
    return null;
  }
  return token;
};

export const setTokens = (accessToken?: string, refreshToken?: string): void => {
  if (typeof window === "undefined") return;

  if (accessToken && accessToken !== "undefined" && accessToken !== "null") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  }

  if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const clearTokens = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
};

export const getCurrentUser = (): AuthUser | null => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const decoded: any = jwtDecode(token);
    return {
      id: Number(decoded.sub ?? decoded.id ?? decoded.userId ?? 0),
      username: decoded.username || "User",
      role: decoded.role || "user",
      exp: decoded.exp,
    };
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  if (!user) return false;

  // Check if JWT token has expired
  if (user.exp && user.exp * 1000 < Date.now()) {
    clearTokens();
    return false;
  }

  return true;
};
