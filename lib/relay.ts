export function relayUrl(path: string) {
  if (typeof window === 'undefined') return `http://localhost:3002${path}`;
  return `${window.location.protocol}//${window.location.hostname}:3002${path}`;
}

export async function relayRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(relayUrl(path), { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || `Relay request failed (${response.status})`);
  return response.json() as Promise<T>;
}
