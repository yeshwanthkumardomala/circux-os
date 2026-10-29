export function relayUrl(path: string) {
  if (typeof window === 'undefined') return `http://localhost:3002${path}`;
  return `${window.location.protocol}//${window.location.hostname}:3002${path}`;
}

const ADMIN_TOKEN_KEY = 'circux-relay-admin-token';

export async function relayRequest<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedToken) headers.set('Authorization', `Bearer ${savedToken}`);
  }
  let response = await fetch(relayUrl(path), { ...init, headers });
  const errorBody = response.status === 401 ? await response.clone().json().catch(() => null) : null;
  if (response.status === 401 && typeof window !== 'undefined' && /Admin authentication required/i.test(errorBody?.error || '')) {
    const token = window.prompt('Enter the local Circux admin token configured as CIRCUX_ADMIN_TOKEN:');
    if (token?.trim()) {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token.trim());
      headers.set('Authorization', `Bearer ${token.trim()}`);
      response = await fetch(relayUrl(path), { ...init, headers });
    }
  }
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || `Relay request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function syncRelay<T>(path: string, value: T) {
  return relayRequest(path, { method: 'PUT', body: JSON.stringify(value) }).catch(() => undefined);
}
