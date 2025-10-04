/**
 * Frontend configuration for API base URL resolution and startup health check.
 *
 * Resolution priority:
 * 1) window.__API_BASE__ (runtime override)
 * 2) REACT_APP_API_BASE (build-time)
 * 3) Same-origin (window.location.origin)
 * 4) http://localhost:3001 (local dev fallback)
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

  // Step 3: same-origin fallback if available
  if (win && win.location && win.location.origin) {
    return (win.location.origin || "").replace(/\/+$/, "");
  }

  // Step 4: final fallback for local development
  return "http://localhost:3001";
}

// PUBLIC_INTERFACE
export async function checkHealth(apiBase = getApiBase()) {
  /** Call the backend health endpoint and return boolean indicating availability. */
  try {
    const res = await fetch(`${apiBase}/api/health`, { method: "GET" });
    if (!res.ok) return false;

    // Try JSON first, then text, normalize to ok/unavailable
    const contentType = res.headers.get("content-type") || "";
    if (/application\/json/i.test(contentType)) {
      const data = await res.json().catch(() => ({}));
      return !!(data && data.status === "ok");
    }
    const text = (await res.text().catch(() => "")).trim().toLowerCase();
    return text === "ok";
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
