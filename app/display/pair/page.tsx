'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronRight, CircleAlert, LoaderCircle, Monitor, Search, Smartphone, Unplug } from 'lucide-react';
import { relayRequest } from '../../../lib/relay';
import { hashDisplayToken } from '../../../lib/display-capability';
import { supabase, supabaseConfigured } from '../../../lib/supabase-browser';
import type { Project } from '../../../lib/project-data';

type DisplayProject = Pick<Project, 'id' | 'name' | 'category' | 'summary' | 'team'>;
type Slot = 'A' | 'B';

export default function PairDisplayPage() {
  const [token, setToken] = useState('');
  const [paired, setPaired] = useState(false);
  const [projects, setProjects] = useState<DisplayProject[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get('token');
    const saved = window.localStorage.getItem('circux-display-token') || '';
    const candidate = incoming || saved;
    if (!candidate) {
      setError('This link is missing its pairing code. Scan the QR displayed on the exhibition screen.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      if (supabaseConfigured && supabase) {
        const { data, error: pairError } = await supabase.rpc('get_display_state', { p_token_hash: await hashDisplayToken(candidate) });
        if (pairError || !data?.length) throw new Error('This display link has expired. Scan the latest QR code on the screen.');
      } else {
        await relayRequest(`/session/${encodeURIComponent(candidate)}/state`);
      }
      if (cancelled) return;
      window.localStorage.setItem('circux-display-token', candidate);
      setToken(candidate);
      setPaired(true);
      setError('');
      if (supabaseConfigured && supabase) {
        const { data, error: projectsError } = await supabase.from('projects').select('id,name,data').eq('is_public', true).eq('is_archived', false).order('name');
        if (projectsError) throw projectsError;
        if (!cancelled) setProjects((data || []).map(row => ({ ...(row.data as Project), id: row.id, name: row.name })));
      } else {
        const data = await relayRequest<Project[]>('/projects');
        if (!cancelled) setProjects(data.filter(project => !project.hidden).map(({ id, name, category, summary, team }) => ({ id, name, category, summary, team })));
      }
    })().catch(reason => {
      if (!cancelled) {
        window.localStorage.removeItem('circux-display-token');
        setPaired(false);
        setError(reason instanceof Error ? reason.message : 'Could not connect to the display.');
      }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter(project => [project.id, project.name, project.category, project.summary, project.team].some(value => value?.toLowerCase().includes(needle)));
  }, [projects, query]);

  const send = useCallback(async (projectId: string, slot: Slot) => {
    if (!token) return;
    setSending(`${projectId}-${slot}`);
    setMessage('');
    setError('');
    try {
      if (supabaseConfigured && supabase) {
        const { data, error: sendError } = await supabase.rpc('set_display_slot', { p_token_hash: await hashDisplayToken(token), p_slot: slot, p_project_id: projectId });
        if (sendError) throw sendError;
        if (!data) throw new Error('The display session expired. Scan the latest pairing QR.');
      } else {
        await relayRequest(`/session/${encodeURIComponent(token)}/slot`, { method: 'POST', body: JSON.stringify({ slot, projectId }) });
      }
      setMessage(`${projectId} is now showing in Slot ${slot}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not send this project. Check the display connection.');
    } finally {
      setSending('');
    }
  }, [token]);

  const unpair = () => {
    window.localStorage.removeItem('circux-display-token');
    setToken('');
    setPaired(false);
    setProjects([]);
    setMessage('');
    setError('Phone unpaired. Scan the QR code on the display to connect again.');
  };

  return <main className="phone-display-page">
    <header className="phone-display-top">
      <Link href="/" className="phone-display-brand"><span className="phone-display-mark">C</span><span>CIRCUX OS<small>EXHIBITION COMPANION</small></span></Link>
      {paired && <span className="phone-paired-status"><i /> Connected</span>}
    </header>
    <section className="phone-display-intro">
      <div className="phone-display-icon"><Smartphone size={23} /></div>
      <p className="phone-display-kicker">PHONE CONTROL</p>
      <h1>Send a project to the big screen.</h1>
      <p className="phone-display-subtitle">Choose a project, then select which display slot should show it. The screen updates automatically.</p>
      {paired && <div className="phone-connected-note"><CheckCircle2 size={16} /> Your phone is paired with the exhibition display.</div>}
    </section>
    {loading ? <section className="phone-display-state"><LoaderCircle className="phone-spin" size={24} /><strong>Connecting to display…</strong><span>Checking your secure pairing link</span></section> :
      !paired ? <section className="phone-display-state phone-display-error"><CircleAlert size={25} /><strong>Display not connected</strong><span>{error || 'Scan the pairing QR code on the display.'}</span><Link href="/display" className="phone-display-link">Open display setup <ChevronRight size={16} /></Link></section> :
      <section className="phone-project-section">
        <div className="phone-project-heading"><div><h2>Choose a project</h2><p>{projects.length} published projects available</p></div><button className="phone-unpair" onClick={unpair}><Unplug size={15} /> Unpair</button></div>
        <label className="phone-project-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search projects by name or ID…" /><span>{filtered.length}</span></label>
        {message && <div className="phone-feedback phone-feedback-success"><CheckCircle2 size={17} /><span>{message}</span></div>}
        {error && <div className="phone-feedback phone-feedback-error"><CircleAlert size={17} /><span>{error}</span></div>}
        <div className="phone-project-list">
          {filtered.map(project => <article className="phone-project-card" key={project.id}>
            <div className="phone-project-card-top"><span className="phone-project-category">{project.category || 'PROJECT'}</span><span className="phone-project-id">{project.id}</span></div>
            <h3>{project.name}</h3><p>{project.summary || 'Open this project on the exhibition display.'}</p>
            <div className="phone-project-card-bottom"><span>{project.team || 'Circux project'}</span><div className="phone-slot-actions">
              <button disabled={Boolean(sending)} onClick={() => void send(project.id, 'A')}>{sending === `${project.id}-A` ? <LoaderCircle className="phone-spin" size={14} /> : null} Slot A</button>
              <button disabled={Boolean(sending)} onClick={() => void send(project.id, 'B')}>{sending === `${project.id}-B` ? <LoaderCircle className="phone-spin" size={14} /> : null} Slot B</button>
            </div></div>
          </article>)}
          {!filtered.length && <div className="phone-no-projects"><Search size={22} /><strong>No matching projects</strong><span>Try another project name or ID.</span></div>}
        </div>
      </section>}
    <footer className="phone-display-footer"><Monitor size={15} /> Keep this page open while controlling the exhibition screen. <span>·</span> <Link href="/display">Display setup</Link></footer>
  </main>;
}
