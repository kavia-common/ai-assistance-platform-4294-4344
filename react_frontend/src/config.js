/**
 * Frontend configuration for API base URL resolution and startup health check.
 *
 * Resolution priority:
 * - If window.__API_BASE__ is set, use it (allows runtime override).
 * - If REACT_APP_API_BASE env is set at build time, use it.
 * - Prefer explicit local backend default http://localhost:3001 for split-port dev/preview.
 * - Finally, use window.location.origin for same-origin reverse-proxy deployments.
 */

// Normalize a candidate base to ensure it looks like an absolute URL string
function normalizeBase(maybe) {
  if (!maybe || typeof maybe !== "string") return null;
  const s = maybe.trim();
  if (!s) return null;
  // Accept http(s) absolute URLs only
  if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, ""); // drop trailing slash
  return null;
}

// PUBLIC_INTERFACE
export function getApiBase() {
  /** Resolve the base URL for API calls. */
  const win = typeof window !== "undefined" ? window : undefined;
  const fromWindow = win && normalizeBase(win.__API_BASE__);
  const fromEnv = normalizeBase(process.env.REACT_APP_API_BASE);

  if (fromWindow) return fromWindow;
  if (fromEnv) return fromEnv;

  // Prefer explicit local backend port for split-port dev environments
  const localDefault = "http://localhost:3001";

  // If running in a context where 3001 is not reachable, callers can override via window.__API_BASE__ or env
  if (typeof window !== "undefined") {
    // In most dev/preview setups, backend is exposed on 3001
    return localDefault;
  }

  // Last resort: same-origin (used when a reverse proxy mounts /api on the same host)
  if (win && win.location) {
    return (win.location.origin || "").replace(/\/+$/, "");
  }
  return localDefault;
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
