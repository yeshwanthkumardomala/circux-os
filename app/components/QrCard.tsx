'use client';

import { useEffect, useState } from 'react';
import { qrImageUrl, projectUrl } from '../../lib/qr';

export default function QrCard({ id, host }: { id: string; host?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => setUrl(projectUrl(id, host || window.location.host)), [id, host]);
  return <div className="qr-card">{url ? <img src={qrImageUrl(url)} alt={`QR code for project ${id}`} /> : <div className="qr-placeholder">Preparing QR…</div>}<strong>Scan for {id}</strong><small>{url || 'Preparing local project link'}</small></div>;
}
