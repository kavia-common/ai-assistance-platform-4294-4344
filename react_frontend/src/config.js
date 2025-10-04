export const resolveApiBase = () => {
  // PUBLIC_INTERFACE
  /** Resolve API base URL following heuristics:
   * 1) Use REACT_APP_API_BASE if present
   * 2) If running on localhost:3000, assume backend on 3001
   * 3) Otherwise use same origin
   */
  const envBase = process.env.REACT_APP_API_BASE;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.replace(/\/+$/, '');
  }

  const { protocol, hostname, port } = window.location;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '3000') {
    return `${protocol}//${hostname}:3001`;
  }

  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
};

export const API_BASE = resolveApiBase();
