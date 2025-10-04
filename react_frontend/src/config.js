/**
 * Resolve the API base URL used by the frontend.
 * Priority:
 * 1) window.__API_BASE__ (runtime)
 * 2) REACT_APP_API_BASE (build-time)
 * 3) If running on :3000, default to http://localhost:3001
 * 4) Same-origin fallback
 */
// PUBLIC_INTERFACE
export function getApiBase() {
  const win = typeof window !== 'undefined' ? window : undefined;

  const normalize = (v) => {
    if (!v || typeof v !== 'string') return null;
    const s = v.trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s.replace(/\/+$/, '');
    return null;
  };

  const fromWindow = win && normalize(win.__API_BASE__);
  const fromEnv = normalize(process.env.REACT_APP_API_BASE);

  if (fromWindow) return fromWindow;
  if (fromEnv) return fromEnv;

  if (win && win.location && win.location.origin) {
    const origin = (win.location.origin || '').replace(/\/+$/, '');
    if (/^https?:\/\/(localhost|127\.0\.0\.1):3000$/i.test(origin)) {
      return 'http://localhost:3001';
    }
    return origin;
  }

  return 'http://localhost:3001';
}
