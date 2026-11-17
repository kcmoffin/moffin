import { CONFIG } from "./config";
import { getAccessToken, clearTokens } from "./auth";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export function getEffectiveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_API_URL);
    if (custom && custom.trim() !== "") {
      return custom.trim().replace(/\/+$/, "");
    }
    // In the browser, use relative URLs so Next.js proxy/rewrites handle routing.
    // This works for both local dev (port 3000) and Vercel production.
    return "";
  }
  // Server-side: use the explicit backend URL (for SSR/RSC if needed)
  return (CONFIG.API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");
}

export function setCustomApiBaseUrl(url: string | null): void {
  if (typeof window === "undefined") return;
  if (url && url.trim() !== "") {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CUSTOM_API_URL, url.trim().replace(/\/+$/, ""));
  } else {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CUSTOM_API_URL);
  }
}

export async function checkBackendHealth(customUrl?: string): Promise<{
  ok: boolean;
  message?: string;
  error?: string;
  url: string;
}> {
  // For health check, always use an explicit backend URL
  const explicitBase = (customUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem(CONFIG.STORAGE_KEYS.CUSTOM_API_URL) || ""
      : "") ||
    CONFIG.API_BASE_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");

  const base = explicitBase || window.location.origin;
  try {
    const res = await fetch(`${base}/`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        ok: true,
        message: data.message || "Backend is running and responsive",
        url: base,
      };
    }
    return {
      ok: false,
      error: `Server responded with status ${res.status}`,
      url: base,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err.name === "TimeoutError" ? "Connection timed out" : (err.message || "Backend offline"),
      url: base,
    };
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers, ...restOptions } = options;

  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      defaultHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const baseUrl = getEffectiveApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${cleanEndpoint}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
  } catch (err: any) {
    throw new Error(
      `Cannot connect to backend at ${baseUrl}. Ensure your NestJS server is running on that port. (${err.message})`
    );
  }

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text();
    data = text ? { message: text } : {};
  }

  if (!response.ok) {
    if (response.status === 401 && requiresAuth) {
      clearTokens();
    }
    const errorMessage =
      data && Array.isArray(data.message)
        ? data.message.join(", ")
        : data?.message || data?.error || `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
  }

  // Handle case where server returns { error: "..." } with 200 OK
  if (data && typeof data === "object" && data.error && !data.accessToken && !data.user_id && !data.id) {
    throw new Error(data.error);
  }

  return data as T;
}
