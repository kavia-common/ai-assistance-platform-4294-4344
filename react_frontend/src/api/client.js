import { API_BASE } from '../config';

// Basic JSON fetch with retry/backoff for network errors only
async function fetchWithRetry(path, options = {}, retries = 2, backoffMs = 400) {
  const url = `${API_BASE}${path}`;
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
  return fetchWithRetry('/api/health', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function getSuggestions() {
  /** Retrieve suggestions from /api/suggest */
  return fetchWithRetry('/api/suggest', { method: 'GET' });
}

// PUBLIC_INTERFACE
export async function postChat(message, context = []) {
  /** Send a chat message to /api/chat with prior context
   * payload: { message: string, context: [{ role, content }] }
   */
  return fetchWithRetry('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, context }),
  });
}
