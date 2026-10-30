'use client';

import { Monitor, Unplug } from 'lucide-react';
import { useEffect, useState } from 'react';
import { relayRequest } from '../../lib/relay';
import { hashDisplayToken } from '../../lib/display-capability';
import { supabase, supabaseConfigured } from '../../lib/supabase-browser';

export default function DisplayActions({ projectId }: { projectId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => setToken(localStorage.getItem('circux-display-token')), []);
  if (!token) return <div className="public-card display-actions"><div><strong><Monitor size={15} /> Display pairing</strong><p>Scan the pairing QR on the large display first. Then this page can send the project to Slot A or Slot B.</p></div><a className="btn" href="/display">Open display</a></div>;
  const send = async (slot: 'A' | 'B') => { try { if (supabaseConfigured && supabase) { const { data, error } = await supabase.rpc('set_display_slot', { p_token_hash: await hashDisplayToken(token), p_slot: slot, p_project_id: projectId }); if (error) throw error; if (!data) throw new Error('Pairing expired.'); } else await relayRequest(`/session/${token}/slot`, { method: 'POST', body: JSON.stringify({ slot, projectId }) }); setMessage(`Sent to Slot ${slot}`); } catch { setMessage('Display session is offline or expired. Pair again.'); } };
  return <div className="public-card display-actions"><div><strong><Monitor size={15} /> Paired display</strong><p>{message || 'Choose where to show this project during the exhibition.'}</p></div><div className="actions"><button className="btn primary" onClick={() => send('A')}>Show in Slot A</button><button className="btn" onClick={() => send('B')}>Show in Slot B</button><button className="icon-btn" aria-label="Unpair display" onClick={() => { localStorage.removeItem('circux-display-token'); setToken(null); }}><Unplug size={15} /></button></div></div>;
}
