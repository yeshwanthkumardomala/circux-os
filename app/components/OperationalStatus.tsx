'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, ShieldAlert } from 'lucide-react';
import { relayRequest } from '../../lib/relay';
import { supabase, supabaseConfigured } from '../../lib/supabase-browser';

type RelayHealth = { ok: boolean; sessions: number };
type DeviceHealth = { configured: boolean; connected: boolean; mode: string; error?: string };

export default function OperationalStatus({ power = false }: { power?: boolean }) {
  const [relay, setRelay] = useState<RelayHealth | null>(null);
  const [device, setDevice] = useState<DeviceHealth | null>(null);
  const [cloudProjects, setCloudProjects] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    if (supabaseConfigured && supabase) {
      const { count, error: cloudError } = await supabase.from('projects').select('id', { count: 'exact', head: true });
      setCloudProjects(cloudError ? null : count || 0); setRelay(null); setDevice(null);
      setError(cloudError ? `Cloud database unavailable: ${cloudError.message}` : ''); setLoading(false); return;
    }
    try {
      const health = await relayRequest<RelayHealth>('/health');
      setRelay(health);
      setError('');
      try { setDevice(await relayRequest<DeviceHealth>('/device/health')); }
      catch { setDevice(null); }
    } catch (reason) {
      setRelay(null);
      setDevice(null);
      setError(reason instanceof Error ? reason.message : 'Relay is unavailable.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const relayLabel = supabaseConfigured ? (loading ? 'Checking' : error ? 'Unavailable' : 'Connected') : loading && !relay ? 'Checking' : relay?.ok ? 'Connected' : 'Disconnected';
  const hardwareLabel = supabaseConfigured ? 'Local agent required' : device?.connected ? 'Connected' : device?.configured ? 'Disconnected' : 'Not configured';
  return <>
    <div className="page-head">
      <div><div className="eyebrow">Operational status · hardware excluded</div><h1>{power ? 'Power manager' : 'Live monitor'}</h1>
        <p>{power ? 'Physical power actions are unavailable until a local hardware adapter is installed.' : 'Shows the actual local relay and hardware adapter health; no readings are fabricated.'}</p>
      </div>
      <button className="btn" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
    </div>
    <div className="grid three">
      <section className="card stat"><div className="stat-label">{supabaseConfigured ? 'Cloud database' : 'Local relay'}</div><div className="stat-value">{relayLabel}</div><div className="trend">{supabaseConfigured ? (cloudProjects === null ? error || 'Checking service' : `${cloudProjects} project records visible`) : relay ? `${relay.sessions} active display sessions` : error || 'Checking service'}</div></section>
      <section className="card stat"><div className="stat-label">Hardware adapter</div><div className="stat-value">{hardwareLabel}</div><div className="trend">{device?.error || 'No device telemetry is shown without a verified connection.'}</div></section>
      <section className="card stat"><div className="stat-label">Sensor readings</div><div className="stat-value">{device?.connected ? 'Available' : supabaseConfigured ? 'Check local agent' : 'Unavailable'}</div><div className="trend">Only verified device readings can appear here.</div></section>
    </div>
    <section className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h3>{power ? 'Power controls' : 'Service details'}</h3><Activity size={16} /></div>
      {power ? <div className="callout"><ShieldAlert size={15} /> No physical command has been sent. Power controls remain unavailable until the hardware gateway is configured and safety checks are completed.</div>
        : <div className="callout">{supabaseConfigured ? 'Cloud project storage is checked above. The event computer must run the local FastAPI agent for USB hardware; this page does not claim that local agent is connected.' : relay?.ok ? 'The local relay is responding. Local display sessions are available on this network.' : 'Start the local exhibition server to enable shared relay operations.'}</div>}
    </section>
  </>;
}
