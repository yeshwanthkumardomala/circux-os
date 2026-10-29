export function saveLocal<T>(key: string, value: T) {
  if (typeof window !== 'undefined') { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional for this local-first prototype */ } }
}

export function loadLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; }
}

export function downloadFile(filename: string, content: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

export function toCsv(rows: (string | number)[][]) {
  return rows.map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
}
