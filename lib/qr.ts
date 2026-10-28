export function projectUrl(id: string, host = typeof window === 'undefined' ? 'localhost:3000' : window.location.host) {
  const protocol = typeof window === 'undefined' ? 'http:' : window.location.protocol;
  return `${protocol}//${host}/project/${encodeURIComponent(id)}`;
}

export function qrImageUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(value)}`;
}
