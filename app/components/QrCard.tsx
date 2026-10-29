'use client';

import { useEffect, useState } from 'react';
import { qrImageUrl, projectUrl } from '../../lib/qr';

export default function QrCard({ id, host }: { id: string; host?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => setUrl(projectUrl(id, host || window.location.host)), [id, host]);
  const image = url ? qrImageUrl(url) : '';
  return <div className="qr-card">{image ? <img src={image} alt={`QR code for project ${id}`} /> : <div className="qr-placeholder">Preparing QR…</div>}<strong>Scan for {id}</strong><small>{url || 'Preparing local project link'}</small>{image && <div className="qr-actions"><a className="btn" href={image} download={`circux-${id}-qr.png`} target="_blank" rel="noreferrer">Download QR</a><button className="btn" onClick={() => window.print()}>Print card</button></div>}</div>;
}
