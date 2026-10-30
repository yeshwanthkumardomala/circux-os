'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, CircuitBoard, Expand, Images, Link as LinkIcon, Play, RefreshCw, Trash2, Users } from 'lucide-react';
import { getProject, type Project, type ProjectReading } from '../../lib/project-data';
import { pairingUrl, qrImageUrl } from '../../lib/qr';
import { relayRequest, relayUrl } from '../../lib/relay';
import GlobalProjectSearch from '../components/GlobalProjectSearch';
import { supabase, supabaseConfigured } from '../../lib/supabase-browser';
import { hashDisplayToken, newDisplayToken } from '../../lib/display-capability';

type Slots = { A: string | null; B: string | null };
type Feed = { readings: ProjectReading[]; state: string; updatedAt: string };

function Panel({ slot, projectId, project, feed, clear }: { slot: 'A' | 'B'; projectId: string | null; project?: Project | null; feed?: Feed; clear: (slot: 'A' | 'B') => void }) {
  project = project || null;
  if (!project) return <section className="display-live-panel display-empty"><div><span className="display-slot">SLOT {slot}</span><h2>Waiting for a project</h2><p>Scan a project QR on the paired phone and send it here.</p></div></section>;
  const details = project.details || { members: [], readings: [], documents: [], circuit: '', video: '', media: { photos: [], documents: [], videos: [] } };
  const readings = feed?.readings || details.readings;
  return <section className="display-live-panel">
    <div className="display-panel-top"><span className="display-slot">SLOT {slot} · {project.id}</span><button className="display-small-button" onClick={() => clear(slot)}><Trash2 size={14} /> Clear</button></div>
    <div className="display-eyebrow">{project.category}</div><h2>{project.name}</h2><p className="display-summary">{project.summary}</p>
    <div className="display-tags"><span>{project.team}</span><span>{project.progress}% prepared</span><span className="display-live-badge">SAVED PROJECT DATA</span></div>
    <div className="display-photo-strip">{details.media?.photos?.slice(0, 3).map(photo => <img key={photo} src={photo} alt="Project demonstration" />) || <div className="display-photo-fallback"><Images size={18} /> No project photos yet</div>}</div>
    <div className="display-live-grid"><div><h3><CircuitBoard size={16} /> Saved project readings</h3>{readings.map(reading => <div className="display-reading" key={reading.label}><span>{reading.label}<small>{reading.note}</small></span><strong>{reading.value}</strong></div>)}</div><div><h3><Users size={16} /> Team</h3>{details.members.map(member => <div className="display-member" key={member.name}><strong>{member.name}</strong><span>{member.role}</span></div>)}</div></div>
    <div className="display-media-links">{details.media?.documents?.map(document => <a key={document.title} href={document.url} target="_blank" rel="noreferrer"><LinkIcon size={13} /> {document.title}</a>)}{details.media?.videos?.map(video => <a key={video.title} href={video.url} target="_blank" rel="noreferrer"><Play size={13} /> {video.title}</a>)}</div>
    <footer>Updated {feed?.updatedAt ? new Date(feed.updatedAt).toLocaleTimeString() : 'from project record'} · saved project record; not verified telemetry</footer>
  </section>;
}

export default function DisplayController() {
  const [token, setToken] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slots>({ A: null, B: null });
  const [feeds, setFeeds] = useState<Record<string, Feed>>({});
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [pairUrl, setPairUrl] = useState('');
  const [relayDisplayUrl, setRelayDisplayUrl] = useState('http://localhost:3002');
  const [projectMap, setProjectMap] = useState<Record<string, Project>>({});
  const projects = useMemo(() => [slots.A, slots.B].filter(Boolean).map(id => projectMap[id!] || (!supabaseConfigured ? getProject(id!) : null)).filter(Boolean) as Project[], [projectMap, slots]);

  useEffect(() => {
    if (supabaseConfigured && supabase) {
      let cancelled = false;
      let createdId: string | null = null;
      void (async () => {
        const { data: auth } = await supabase!.auth.getUser();
        if (!auth.user) throw new Error('Sign in with an event staff account before creating a cloud display session.');
        const rawToken = newDisplayToken();
        const { data, error } = await supabase!.from('exhibition_pairings').insert({ display_name: 'Circux live display', token_hash: await hashDisplayToken(rawToken), slots: { A: null, B: null }, expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), created_by: auth.user.id }).select('id,slots').single();
        if (error) throw error;
        createdId = data.id;
        if (cancelled) { await supabase!.from('exhibition_pairings').update({ expires_at: new Date().toISOString() }).eq('id', data.id); return; }
        setToken(rawToken); setSlots(data.slots as Slots); setPairUrl(pairingUrl(rawToken)); setConnected(true); setRelayDisplayUrl('Supabase cloud session'); setError('');
      })().catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not create cloud display session.'); });
      return () => { cancelled = true; if (createdId) void supabase!.from('exhibition_pairings').update({ expires_at: new Date().toISOString() }).eq('id', createdId); };
    }
    setRelayDisplayUrl(relayUrl(''));
    let cancelled = false;
    Promise.all([relayRequest<{ token: string; slots: Slots }>('/session', { method: 'POST' }), relayRequest<{ host: string }>('/network')]).then(([data, network]) => {
      if (cancelled) return;
      setToken(data.token); setSlots(data.slots); setPairUrl(pairingUrl(data.token, `${network.host}:3000`)); setConnected(true); setError('');
    }).catch(() => { if (!cancelled) setError('Relay offline. Start exhibition mode with npm run exhibition.'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const ids = [slots.A, slots.B].filter(Boolean) as string[];
    if (!ids.length) return;
    if (supabaseConfigured && supabase) {
      void supabase.from('projects').select('id,name,data').in('id', ids).eq('is_public', true).eq('is_archived', false).then(({ data, error }) => {
        if (error) { setError(`Could not load display projects: ${error.message}`); return; }
        setProjectMap(current => ({ ...current, ...Object.fromEntries((data || []).map(row => [row.id, { ...(row.data as Project), id: row.id, name: row.name }])) }));
      });
      return;
    }
    Promise.all(ids.map(id => relayRequest<Project>(`/projects/${encodeURIComponent(id)}`).then(project => [id, project] as const).catch(() => null))).then(results => {
      setProjectMap(current => Object.fromEntries([...Object.entries(current), ...results.filter(Boolean) as [string, Project][]]));
    });
  }, [slots]);

  useEffect(() => {
    if (!token) return;
    if (supabaseConfigured && supabase) {
      let stopped = false;
      const poll = async () => {
        try {
          const { data, error } = await supabase!.rpc('get_display_state', { p_token_hash: await hashDisplayToken(token) });
          if (error) throw error;
          if (!data?.length) { setConnected(false); setError('Display session expired. Reload to create a new session.'); return; }
          if (!stopped) { setSlots(data[0].slots as Slots); setConnected(true); setError(''); }
        } catch { if (!stopped) { setConnected(false); setError('Cloud display connection lost. Retrying…'); } }
      };
      void poll(); const timer = window.setInterval(() => void poll(), 1500);
      return () => { stopped = true; window.clearInterval(timer); };
    }
    const events = new EventSource(relayUrl(`/session/${token}/events`));
    events.onopen = () => setConnected(true);
    events.onerror = () => setConnected(false);
    events.onmessage = event => {
      const data = JSON.parse(event.data);
      if (data.slots) setSlots(data.slots);
      if (data.type === 'feed:update') setFeeds(current => ({ ...current, [data.projectId]: { readings: data.readings, state: data.state, updatedAt: data.updatedAt } }));
    };
    return () => events.close();
  }, [token]);

  const clear = async (slot: 'A' | 'B') => { if (!token) return; if (supabaseConfigured && supabase) { const { data, error } = await supabase.rpc('set_display_slot', { p_token_hash: await hashDisplayToken(token), p_slot: slot, p_project_id: null }); if (error || !data) setError('Could not clear display slot.'); return; } await relayRequest(`/session/${token}/clear`, { method: 'POST', body: JSON.stringify({ slot }) }).catch(() => setError('Could not update the relay.')); };
  const swap = async () => { if (!token) return; if (supabaseConfigured && supabase) { const { data, error } = await supabase.rpc('swap_display_slots', { p_token_hash: await hashDisplayToken(token) }); if (error || !data) setError('Could not swap display slots.'); return; } await relayRequest(`/session/${token}/swap`, { method: 'POST' }).catch(() => setError('Could not update the relay.')); };
  const fullscreen = () => document.documentElement.requestFullscreen?.();

  return <main className="display-page display-console"><header className="display-header"><span>CIRCUX OS · LIVE EXHIBITION DISPLAY</span><GlobalProjectSearch compact /><div className="display-header-actions"><span className={connected ? 'display-connection connected' : 'display-connection'}>● {connected ? (supabaseConfigured ? 'CLOUD CONNECTED' : 'RELAY CONNECTED') : 'DISCONNECTED'}</span><button className="display-small-button" onClick={fullscreen}><Expand size={14} /> Fullscreen</button></div></header>
    <section className="display-console-head"><div><div className="display-eyebrow">Two project showcase</div><h1>Live project display</h1><p>Pair a phone, then send any scanned project to Slot A or Slot B. Sessions expire after four hours.</p></div>{pairUrl && <div className="pair-card"><img src={qrImageUrl(pairUrl)} alt="Pair phone with this display" /><div><strong>Pair a phone</strong><small>Scan once, then scan project QR cards</small></div></div>}</section>
    {error && <div className="display-alert"><RefreshCw size={15} /> {error}</div>}
    <div className="display-console-actions"><button className="display-small-button" onClick={swap}><ArrowLeftRight size={14} /> Swap slots</button><span>{projects.length} project{projects.length === 1 ? '' : 's'} active · relay-synchronized project display</span></div>
    <div className="display-live-columns"><Panel slot="A" projectId={slots.A} project={slots.A ? projectMap[slots.A] : null} feed={slots.A ? feeds[slots.A] : undefined} clear={clear} /><Panel slot="B" projectId={slots.B} project={slots.B ? projectMap[slots.B] : null} feed={slots.B ? feeds[slots.B] : undefined} clear={clear} /></div>
    <footer>{supabaseConfigured ? 'Phones and display need internet access to sync this cloud session.' : `Phone and display must use the same Wi-Fi · Relay: ${relayDisplayUrl}`}</footer>
  </main>;
}
