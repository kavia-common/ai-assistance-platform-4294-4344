 /**
  * Frontend configuration for API base URL resolution and startup health check.
  *
  * Resolution priority:
  * 1) window.__API_BASE__ (runtime override)
  * 2) REACT_APP_API_BASE (build-time)
  * 3) Same-origin (window.location.origin) unless it's 3000 dev port
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

   if (fromWindow) {
     try { console.debug("[config] Using window.__API_BASE__:", fromWindow); } catch {}
     return fromWindow;
   }
   if (fromEnv) {
     try { console.debug("[config] Using REACT_APP_API_BASE:", fromEnv); } catch {}
     return fromEnv;
   }

   // Step 3: same-origin fallback if available
   if (win && win.location && win.location.origin) {
     const sameOrigin = (win.location.origin || "").replace(/\/+$/, "");
     // If the app is served on typical CRA dev port 3000, prefer backend default 3001 unless explicitly overridden.
     if (/^https?:\/\/localhost:3000$/i.test(sameOrigin) || /^https?:\/\/127\.0\.0\.1:3000$/i.test(sameOrigin)) {
       try { console.debug("[config] Same-origin is 3000; preferring backend default http://localhost:3001"); } catch {}
       return "http://localhost:3001";
     }
     try { console.debug("[config] Using same-origin:", sameOrigin); } catch {}
     return sameOrigin;
   }

   // Step 4: final fallback for local development
   try { console.debug("[config] Falling back to default http://localhost:3001"); } catch {}
   return "http://localhost:3001";
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
     try { console.warn("[config] Health non-OK status:", res.status); } catch {}
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
