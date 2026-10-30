'use client';

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured, localMode } from '../../lib/supabase-browser';

export type CircuxRole = 'admin' | 'instructor' | 'judge' | 'viewer';
type AuthValue = { role: CircuxRole; user: User | null; local: boolean; signOut: () => Promise<void> };
const AuthContext = createContext<AuthValue>({ role: 'viewer', user: null, local: false, signOut: async () => {} });
export const useCircuxAuth = () => useContext(AuthContext);

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<CircuxRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    void supabase.auth.getSession().then(({ data }) => { if (active) setSession(data.session); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) { setRole(null); setLoading(false); return; }
    setLoading(true);
    void supabase.from('profiles').select('role').eq('id', session.user.id).single()
      .then(({ data, error }) => { setRole(error ? null : data.role as CircuxRole); setMessage(error ? `Account profile unavailable: ${error.message}` : ''); setLoading(false); });
  }, [session?.user.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setMessage('');
    const result = signup
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: email.trim().split('@')[0] } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (signup && !result.data.session) setMessage('Check your email to confirm the account, then sign in. New accounts start with viewer access.');
  };

  const signOut = async () => { await supabase?.auth.signOut(); setRole(null); };
  const local = localMode || (!supabaseConfigured && process.env.NODE_ENV !== 'production');
  if (loading) return <main className="auth-screen"><p>Checking account and access…</p></main>;
  if (!supabaseConfigured && !local) return <main className="auth-screen"><section className="auth-card"><h1>Cloud services are not configured</h1><p>Set the Supabase URL and publishable key in the Vercel project environment, then redeploy.</p></section></main>;
  if (local) return <AuthContext.Provider value={{ role: 'admin', user: null, local: true, signOut }}>{children}</AuthContext.Provider>;
  if (!session) return <main className="auth-screen"><section className="auth-card"><div className="eyebrow">Circux OS account</div><h1>{signup ? 'Create account' : 'Sign in'}</h1><p>Use your event account. New registrations have viewer permissions until an administrator assigns a role.</p><form onSubmit={event => void submit(event)}><label className="field">Email<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></label><label className="field">Password<input type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={10} required value={password} onChange={event => setPassword(event.target.value)} /></label><button className="btn primary" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button></form>{message && <p role="status" className="auth-message">{message}</p>}<button className="text-button" onClick={() => { setSignup(value => !value); setMessage(''); }}>{signup ? 'Already registered? Sign in' : 'Need an account? Create one'}</button></section></main>;
  if (!role) return <main className="auth-screen"><section className="auth-card"><h1>Account access pending</h1><p>{message || 'Your profile is not assigned a role yet. Ask an administrator to grant instructor, judge, or viewer access.'}</p><button className="btn" onClick={() => void signOut()}>Sign out</button></section></main>;
  if (role === 'viewer') return <main className="auth-screen"><section className="auth-card"><h1>Viewer account</h1><p>Use public project QR pages to browse showcases. Ask an administrator for a judge or staff role to access the workspace.</p><button className="btn" onClick={() => void signOut()}>Sign out</button></section></main>;
  return <AuthContext.Provider value={{ role, user: session.user, local: false, signOut }}>{children}</AuthContext.Provider>;
}
