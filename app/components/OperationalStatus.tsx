'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, ShieldAlert } from 'lucide-react';
import { relayRequest } from '../../lib/relay';

type RelayHealth = { ok: boolean; sessions: number };
type DeviceHealth = { configured: boolean; connected: boolean; mode: string; error?: string };

export default function OperationalStatus({ power = false }: { power?: boolean }) {
  const [relay, setRelay] = useState<RelayHealth | null>(null);
  const [device, setDevice] = useState<DeviceHealth | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
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

  const relayLabel = loading && !relay ? 'Checking' : relay?.ok ? 'Connected' : 'Disconnected';
  const hardwareLabel = device?.connected ? 'Connected' : device?.configured ? 'Disconnected' : 'Not configured';
  return <>
    <div className="page-head">
      <div><div className="eyebrow">Operational status · hardware excluded</div><h1>{power ? 'Power manager' : 'Live monitor'}</h1>
        <p>{power ? 'Physical power actions are unavailable until a local hardware adapter is installed.' : 'Shows the actual local relay and hardware adapter health; no readings are fabricated.'}</p>
      </div>
      <button className="btn" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} /> Refresh</button>
    </div>
    <div className="grid three">
      <section className="card stat"><div className="stat-label">Local relay</div><div className="stat-value">{relayLabel}</div><div className="trend">{relay ? `${relay.sessions} active display sessions` : error || 'Checking service'}</div></section>
      <section className="card stat"><div className="stat-label">Hardware adapter</div><div className="stat-value">{hardwareLabel}</div><div className="trend">{device?.error || 'No device telemetry is shown without a verified connection.'}</div></section>
      <section className="card stat"><div className="stat-label">Sensor readings</div><div className="stat-value">{device?.connected ? 'Available' : 'Unavailable'}</div><div className="trend">Only verified device readings can appear here.</div></section>
    </div>
    <section className="card" style={{ marginTop: 16 }}>
      <div className="card-head"><h3>{power ? 'Power controls' : 'Service details'}</h3><Activity size={16} /></div>
      {power ? <div className="callout"><ShieldAlert size={15} /> No physical command has been sent. Power controls remain unavailable until the hardware gateway is configured and safety checks are completed.</div>
        : <div className="callout">{relay?.ok ? 'The local relay is responding. Project, judging, and upload operations can use it on the same network.' : 'Start the local exhibition server to enable shared relay operations. This hosted page has no cloud API configured.'}</div>}
    </section>
  </>;
}
