 /**
  * Frontend configuration for API base URL resolution and startup health check.
  *
  * Resolution priority:
  * 1) window.__API_BASE__ (runtime override)
  * 2) REACT_APP_API_BASE (build-time)
  * 3) http://localhost:3001 (local dev when UI served at :3000)
  * 4) Same-origin (window.location.origin) for proxied deployments
  *
  * Notes:
  * - We log the final chosen base once for easier debugging in preview/production.
  * - We avoid adding custom headers globally to reduce unnecessary CORS preflights.
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

 let cachedApiBase = null;

 // PUBLIC_INTERFACE
 export function getApiBase() {
   /** Resolve the base URL for API calls. */
   if (cachedApiBase) return cachedApiBase;

   const win = typeof window !== "undefined" ? window : undefined;
   const fromWindow = win && normalizeBase(win.__API_BASE__);
   const fromEnv = normalizeBase(process.env.REACT_APP_API_BASE);

   if (fromWindow) {
     cachedApiBase = fromWindow;
   } else if (fromEnv) {
     cachedApiBase = fromEnv;
   } else if (win && win.location && win.location.origin) {
     const origin = (win.location.origin || "").replace(/\/+$/, "");
     // In CRA dev on port 3000, default to backend port 3001 unless overridden.
     if (/^https?:\/\/(localhost|127\.0\.0\.1):3000$/i.test(origin)) {
       cachedApiBase = "http://localhost:3001";
     } else {
       // Same-origin for reverse-proxied deployments
       cachedApiBase = origin;
     }
   } else {
     cachedApiBase = "http://localhost:3001";
   }

   try { console.info("[config] API base resolved to:", cachedApiBase); } catch {}
   return cachedApiBase;
 }

 // PUBLIC_INTERFACE
 export async function checkHealth(apiBase = getApiBase()) {
   /** Call the backend health endpoint and return boolean indicating availability. */
   const url = `${apiBase}/api/health`;
   try {
     try { console.debug("[config] Health check URL:", url); } catch {}
     const res = await fetch(url, { method: "GET" });
     // If server returns 200, consider it healthy regardless of body format
     if (res.ok) {
       // Best-effort body normalization for logging/compat
       const contentType = res.headers.get("content-type") || "";
       if (/application\/json/i.test(contentType)) {
         const data = await res.json().catch(() => ({}));
         try { console.debug("[config] Health JSON:", data); } catch {}
         return true;
       }
       const text = (await res.text().catch(() => "")).trim();
       try { console.debug("[config] Health text:", text); } catch {}
       return true;
     }
     try { console.warn("[config] Health non-OK status:", res.status, await res.text().catch(() => "")); } catch {}
     return false;
   } catch (e) {
     try { console.error("[config] Health check error:", e?.message || e); } catch {}
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
