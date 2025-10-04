import { getApiBase } from '../config';

// PUBLIC_INTERFACE
export async function getSuggestions() {
  try {
    const base = getApiBase();
    const res = await fetch(`${base}/api/suggest`, { method: 'GET' });
    if (!res.ok) return [];
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch {
    return [];
  }
}
