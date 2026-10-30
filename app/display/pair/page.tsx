'use client';

import Link from 'next/link';
import { Check, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import GlobalProjectSearch from '../../components/GlobalProjectSearch';
import { relayRequest } from '../../../lib/relay';
import { hashDisplayToken } from '../../../lib/display-capability';
import { supabase, supabaseConfigured } from '../../../lib/supabase-browser';

export default function PairDisplayPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const token = new URLSearchParams(window.location.search).get('token'); if (!token) return; const pair = async () => { if (supabaseConfigured && supabase) { const { data, error } = await supabase.rpc('get_display_state', { p_token_hash: await hashDisplayToken(token) }); if (error || !data?.length) throw new Error('Pairing expired or invalid.'); } else await relayRequest(`/session/${encodeURIComponent(token)}/state`); localStorage.setItem('circux-display-token', token); setReady(true); }; void pair().catch(() => { localStorage.removeItem('circux-display-token'); setReady(false); }); }, []);
  return <main className="public-page"><div className="public-search-row"><GlobalProjectSearch /></div><div className="public-card error-card"><Smartphone size={32} color="var(--blue)" /><div className="eyebrow">Circux OS · display pairing</div><h1>{ready ? 'Phone paired' : 'Pairing link unavailable'}</h1><p>{ready ? 'Now scan any project QR card. Each project page will let you send it to Slot A or Slot B on the display.' : 'Scan the pairing QR shown on the large display again.'}</p>{ready && <div className="actions" style={{ justifyContent: 'center' }}><Check size={16} color="var(--green)" /><span>Connected to this display session</span></div>}<Link href="/">Open Circux workspace</Link></div></main>;
}
