import { getApiBase } from '../config';

// Basic JSON/text fetch with retry/backoff for network errors only
async function fetchWithRetry(path, options = {}, retries = 2, backoffMs = 400) {
  const base = getApiBase();
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    // Treat non-2xx as error but do not retry unless status is 502/503/504
    if (!res.ok) {
      if ([502, 503, 504].includes(res.status) && retries > 0) {
        await new Promise(r => setTimeout(r, backoffMs));
        return fetchWithRetry(path, options, retries - 1, backoffMs * 1.5);
      }
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }

    // Attempt json, fallback to text
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
  /** Get backend health status from /api/health */
  try {
    const data = await fetchWithRetry('/api/health', { method: 'GET' });
    // Normalize to 'ok' or 'unavailable'
    if (data && typeof data === 'object' && data.status === 'ok') {
      return 'ok';
    }
    const text = typeof data === 'string' ? data.trim().toLowerCase() : '';
    if (text === 'ok') return 'ok';
    return 'unavailable';
  } catch {
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
