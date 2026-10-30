'use client';

import { useEffect, useState } from 'react';
import { useCircuxAuth, type CircuxRole } from './AuthGate';
import { supabase } from '../../lib/supabase-browser';

type Account = { id: string; email: string; display_name: string; role: CircuxRole; created_at: string };
const roles: CircuxRole[] = ['admin', 'instructor', 'judge', 'viewer'];

export default function UserAccessPanel() {
  const { user } = useCircuxAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [message, setMessage] = useState('Loading accounts…');
  const [busyId, setBusyId] = useState('');
  const load = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('profiles').select('id,email,display_name,role,created_at').order('created_at');
    if (error) { setMessage(`Could not load accounts: ${error.message}`); return; }
    setAccounts((data || []) as Account[]); setMessage('');
  };
  useEffect(() => { void load(); }, []);
  const changeRole = async (account: Account, role: CircuxRole) => {
    if (!supabase || account.id === user?.id || role === account.role) return;
    setBusyId(account.id); setMessage('');
    const { data, error } = await supabase.rpc('admin_set_circux_role', { p_user_id: account.id, p_role: role });
    if (error || !data) setMessage(error?.message || 'Role update was not applied.');
    else { setAccounts(current => current.map(item => item.id === account.id ? { ...item, role } : item)); setMessage(`Updated access for ${account.email || account.display_name || account.id}.`); }
    setBusyId('');
  };
  return <section className="card" style={{ marginTop: 16 }}><div className="card-head"><h2>Account access</h2><span className="badge blue">Administrator</span></div><p className="muted">New accounts start as viewers. Role changes are checked by a database function; your own role is protected.</p>{accounts.map(account => <div className="project-row" key={account.id}><div className="asset-info"><strong>{account.display_name || account.email || account.id}</strong><small>{account.email} · {account.id.slice(0, 8)}{account.id === user?.id ? ' · You' : ''}</small></div><select aria-label={`Role for ${account.email || account.id}`} value={account.role} disabled={account.id === user?.id || busyId === account.id} onChange={event => void changeRole(account, event.target.value as CircuxRole)}>{roles.map(role => <option key={role} value={role}>{role}</option>)}</select></div>)}{message && <p className="muted" role="status">{message}</p>}</section>;
}
