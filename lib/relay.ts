export function relayUrl(path: string) {
  if (typeof window === 'undefined') return `http://localhost:3002${path}`;
  return `${window.location.protocol}//${window.location.hostname}:3002${path}`;
}

const ADMIN_TOKEN_KEY = 'circux-relay-admin-token';
let tokenPromptPromise: Promise<string | null> | null = null;

function promptForAdminToken(hasSavedToken: boolean) {
  if (!tokenPromptPromise) {
    const promptText = hasSavedToken
      ? 'The saved Circux admin token was rejected. Enter the correct CIRCUX_ADMIN_TOKEN:'
      : 'Enter the local Circux admin token configured as CIRCUX_ADMIN_TOKEN:';
    tokenPromptPromise = Promise.resolve(window.prompt(promptText)?.trim() || null)
      .finally(() => { tokenPromptPromise = null; });
  }
  return tokenPromptPromise;
}

export async function relayFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (typeof window !== 'undefined') {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (savedToken) headers.set('Authorization', `Bearer ${savedToken}`);
  }
  let response = await fetch(relayUrl(path), { ...init, headers });
  const errorBody = response.status === 401 ? await response.clone().json().catch(() => null) : null;
  if (response.status === 401 && typeof window !== 'undefined' && /Admin authentication required/i.test(errorBody?.error || '')) {
    const savedToken = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    const token = await promptForAdminToken(Boolean(savedToken));
    if (token) {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
      window.localStorage.setItem('circux-admin-token', token);
    }
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      response = await fetch(relayUrl(path), { ...init, headers });
    }
  }
  return response;
}

export async function relayRequest<T>(path: string, init?: RequestInit) {
  const response = await relayFetch(path, init);
  if (!response.ok) throw new Error((await response.clone().json().catch(() => null))?.error || `Relay request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function syncRelay<T>(path: string, value: T) {
  return relayRequest(path, { method: 'PUT', body: JSON.stringify(value) }).catch(() => undefined);
}
