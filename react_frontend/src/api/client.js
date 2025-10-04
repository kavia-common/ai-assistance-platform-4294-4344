import { getApiBase } from '../config';

/**
 * Basic JSON/text fetch with retry/backoff for network errors only.
 * - Adds Content-Type only when we have a body and it wasn't provided.
 * - Avoids adding default Accept/Authorization headers to reduce preflights.
 * - Attaches status/statusText/url to thrown errors for better UI surfacing.
 */
async function fetchWithRetry(path, options = {}, retries = 2, backoffMs = 400) {
  const base = getApiBase();
  const url = `${base}${path}`;
  try {
    try { console.debug("[api] fetchWithRetry URL:", url); } catch {}
    const hasBody = typeof options.body !== 'undefined' && options.body !== null;
    const providedHeaders = options.headers || {};
    const lower = (k) => String(k || '').toLowerCase();
    const contentTypeProvided = Object.keys(providedHeaders).some(
      (k) => lower(k) === 'content-type'
    );
    const headers = {
      ...(hasBody && !contentTypeProvided ? { 'Content-Type': 'application/json' } : {}),
      // Intentionally avoid Accept/Authorization/custom headers unless provided
      ...providedHeaders,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if ([502, 503, 504].includes(res.status) && retries > 0) {
        await new Promise(r => setTimeout(r, backoffMs));
        return fetchWithRetry(path, options, retries - 1, backoffMs * 1.5);
      }
      const text = await res.text().catch(() => '');
      const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
      err.status = res.status;
      err.statusText = res.statusText;
      err.url = url;
      throw err;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return res.json();
    }
    return res.text();
  } catch (err) {
    // Network-level error: retry
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoffMs));
      return fetchWithRetry(path, options, retries - 1, backoffMs * 1.5);
    }
    throw err;
  }
}

 // PUBLIC_INTERFACE
 export async function getHealth() {
   /** Get backend health status from /api/health
    * Behavior:
    * - Constructs URL as `${getApiBase()}/api/health` (e.g., http://localhost:3001/api/health for local dev)
    * - Treats any HTTP 200 response as "ok" regardless of body or content-type
    * - Returns 'ok' or 'unavailable'
    */
   try {
     const base = getApiBase();
     const url = `${base}/api/health`;
     try { console.debug("[api] getHealth URL:", url); } catch {}
     const res = await fetch(url, { method: 'GET' });
     if (res.ok) {
       const ct = (res.headers.get('content-type') || '').toLowerCase();
       if (ct.includes('application/json')) {
         const data = await res.json().catch(() => ({}));
         try { console.debug("[api] getHealth JSON:", data); } catch {}
       } else {
         const text = (await res.text().catch(() => '')).trim();
         try { console.debug("[api] getHealth text:", text); } catch {}
       }
       return 'ok';
     }
     try { console.warn("[api] getHealth non-OK status:", res.status); } catch {}
     return 'unavailable';
   } catch (e) {
     try { console.error("[api] getHealth error:", e?.message || e); } catch {}
     return 'unavailable';
   }
 }

 // PUBLIC_INTERFACE
export async function getSuggestions() {
  /** Retrieve suggestions from /api/suggest */
  return fetchWithRetry('/api/suggest', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function postChat({ messages = [], prompt = '' } = {}) {
  /** Send chat data to /api/chat with prior messages and prompt
   * payload: { messages: [{ role, content }], prompt: string }
   * expects response: { message: { role, content } }
   * returns normalized { role, content }
   */
  const res = await fetchWithRetry('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, prompt }),
  });

  // Normalize response
  if (res && typeof res === 'object') {
    const message = res.message || res.reply || res.data;
    if (message && typeof message === 'object' && message.role && message.content) {
      return { role: message.role, content: message.content };
    }
    // Fallback: if reply is string
    if (typeof res.reply === 'string') {
      return { role: 'assistant', content: res.reply };
    }
  }
  // Fallback to stringifiable content
  const text = typeof res === 'string' ? res : JSON.stringify(res ?? '');
  return { role: 'assistant', content: text || '(no response)' };
}
