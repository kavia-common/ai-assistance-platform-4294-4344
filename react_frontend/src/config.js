/**
 * Frontend configuration for API base URL resolution and startup health check.
 *
 * Resolution priority:
 * - If window.__API_BASE__ is set, use it (allows runtime override).
 * - If REACT_APP_API_BASE env is set at build time, use it.
 * - If same-origin deployment with backend mounted under /, use window.location.origin.
 * - Fallback to http://localhost:3001 for local dev.
 */

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Resolve the base URL for API calls. */
  const win = typeof window !== "undefined" ? window : undefined;
  const fromWindow = win && win.__API_BASE__;
  const fromEnv = process.env.REACT_APP_API_BASE;

  if (fromWindow && typeof fromWindow === "string") return fromWindow;
  if (fromEnv && typeof fromEnv === "string") return fromEnv;

  if (win && win.location) {
    // If frontend is served from the same host as backend, prefer same origin.
    // This works when a reverse proxy maps /api to backend.
    return win.location.origin;
  }
  return "http://localhost:3001";
}

// PUBLIC_INTERFACE
export async function checkHealth(apiBase = getApiBase()) {
  /** Call the backend health endpoint and return boolean indicating availability. */
  try {
    const res = await fetch(`${apiBase}/api/health`, { method: "GET" });
    if (!res.ok) return false;
    const data = await res.json().catch(() => ({}));
    return data && data.status === "ok";
  } catch {
    return false;
  }
}

// PUBLIC_INTERFACE
export function initHealthCheck(onStatus) {
  /**
   * Perform a health check on app load and notify via callback.
   * The callback receives an object: { ok: boolean, apiBase: string }
   */
  const apiBase = getApiBase();
  checkHealth(apiBase).then((ok) => {
    if (typeof onStatus === "function") {
      onStatus({ ok, apiBase });
    }
  });
}
