'use client';

import Link from 'next/link';
import { Check, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function PairDisplayPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const token = new URLSearchParams(window.location.search).get('token'); if (token) { localStorage.setItem('circux-display-token', token); setReady(true); } }, []);
  return <main className="public-page"><div className="public-card error-card"><Smartphone size={32} color="var(--blue)" /><div className="eyebrow">Circux OS · display pairing</div><h1>{ready ? 'Phone paired' : 'Pairing link unavailable'}</h1><p>{ready ? 'Now scan any project QR card. Each project page will let you send it to Slot A or Slot B on the display.' : 'Scan the pairing QR shown on the large display again.'}</p>{ready && <div className="actions" style={{ justifyContent: 'center' }}><Check size={16} color="var(--green)" /><span>Connected to this display session</span></div>}<Link href="/">Open Circux workspace</Link></div></main>;
}
