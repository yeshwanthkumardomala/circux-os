'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Copy, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

export default function AdminAccessInfo() {
  const [token, setToken] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => setToken(localStorage.getItem('circux-admin-token') || localStorage.getItem('circux-relay-admin-token') || ''), []);

  const saveToken = () => {
    const value = token.trim();
    if (!value) { setMessage('Enter the token from the RUN-CIRCUX window or local .env file.'); return; }
    localStorage.setItem('circux-admin-token', value);
    localStorage.setItem('circux-relay-admin-token', value);
    setToken(value);
    setMessage('Admin token saved in this browser for Board Health and relay access.');
  };

  const copyToken = async () => {
    try { await navigator.clipboard.writeText(token); setMessage('Token copied. Keep it private.'); }
    catch { setMessage('Clipboard access is unavailable in this browser.'); }
  };

  return <section className="card admin-access"><div className="card-head"><h2><ShieldCheck size={17} /> Local backend access</h2><KeyRound size={16} /></div><p>The local <code>CIRCUX_ADMIN_TOKEN</code> is in the repository-root <code>.env</code> file. On Windows, <code>RUN-CIRCUX.bat</code> creates it when missing and prints it in the launch window. This page cannot read the computer’s <code>.env</code> directly; paste the value here once to keep it available in this browser.</p><div className="admin-token-controls"><label className="field" htmlFor="circux-admin-token">Admin token<input id="circux-admin-token" type={visible ? 'text' : 'password'} autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="Paste CIRCUX_ADMIN_TOKEN" /></label><div className="actions"><button className="btn" type="button" onClick={() => setVisible(current => !current)}>{visible ? <EyeOff size={14} /> : <Eye size={14} />}{visible ? 'Hide' : 'Show'}</button><button className="btn" type="button" onClick={() => void copyToken()} disabled={!token}><Copy size={14} /> Copy</button><button className="btn primary" type="button" onClick={saveToken}>Save token</button></div></div>{message && <p className="asset-message" role="status">{message}</p>}<p className="muted">This token is separate from each board’s device token. It is stored in this browser’s local storage. Do not share it or include it in QR codes.</p><a className="text-button" href="http://localhost:8000/docs" target="_blank" rel="noreferrer">Open local FastAPI documentation <ArrowUpRight size={13} /></a></section>;
}
