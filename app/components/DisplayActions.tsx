'use client';

import { Monitor, Unplug } from 'lucide-react';
import { useEffect, useState } from 'react';
import { relayRequest } from '../../lib/relay';

export default function DisplayActions({ projectId }: { projectId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => setToken(localStorage.getItem('circux-display-token')), []);
  if (!token) return <div className="public-card display-actions"><div><strong><Monitor size={15} /> Display pairing</strong><p>Scan the pairing QR on the large display first. Then this page can send the project to Slot A or Slot B.</p></div><a className="btn" href="/display">Open display</a></div>;
  const send = (slot: 'A' | 'B') => relayRequest(`/session/${token}/slot`, { method: 'POST', body: JSON.stringify({ slot, projectId }) }).then(() => setMessage(`Sent to Slot ${slot}`)).catch(() => setMessage('Display session is offline. Pair again.'));
  return <div className="public-card display-actions"><div><strong><Monitor size={15} /> Paired display</strong><p>{message || 'Choose where to show this project during the exhibition.'}</p></div><div className="actions"><button className="btn primary" onClick={() => send('A')}>Show in Slot A</button><button className="btn" onClick={() => send('B')}>Show in Slot B</button><button className="icon-btn" aria-label="Unpair display" onClick={() => { localStorage.removeItem('circux-display-token'); setToken(null); }}><Unplug size={15} /></button></div></div>;
}
