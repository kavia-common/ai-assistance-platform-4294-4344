import { getApiBase } from '../config';

/**
 * Minimal fetch helper with simple retry on network errors and 502/503/504.
 */
async function fetchWithRetry(path, options = {}, retries = 1, backoffMs = 400) {
  const base = getApiBase();
  const url = `${base}${path}`;
  try {
    const hasBody = options.body != null;
    const headers = {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if ([502, 503, 504].includes(res.status) && retries > 0) {
        await new Promise(r => setTimeout(r, backoffMs));
        return fetchWithRetry(path, options, retries - 1, backoffMs * 1.5);
      }
      const text = await res.text().catch(() => '');
      const err = new Error(text || res.statusText || `HTTP ${res.status}`);
      err.status = res.status;
      err.url = url;
      throw err;
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();
    return res.text();
  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoffMs));
      return fetchWithRetry(path, options, retries - 1, backoffMs * 1.5);
    }
    throw e;
  }
}

// PUBLIC_INTERFACE
export async function getHealth() {
  /** Returns 'ok' for any HTTP 200 from /api/health; otherwise 'unavailable'. */
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/health`, { method: 'GET' });
    return res.ok ? 'ok' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

// PUBLIC_INTERFACE
export async function postChat({ messages = [], prompt = '' } = {}) {
  /** POST to /api/chat; returns normalized { role, content } or assistant string. */
  const res = await fetchWithRetry('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, prompt }),
  });

  if (res && typeof res === 'object') {
    const msg = res.message || res.reply || res.data;
    if (msg && typeof msg === 'object' && msg.role && msg.content) {
      return { role: msg.role, content: msg.content };
    }
    if (typeof res.reply === 'string') return { role: 'assistant', content: res.reply };
  }
  const text = typeof res === 'string' ? res : JSON.stringify(res ?? '');
  return { role: 'assistant', content: text || '(no response)' };
}
