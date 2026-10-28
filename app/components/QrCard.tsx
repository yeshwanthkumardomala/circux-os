'use client';

import { qrImageUrl, projectUrl } from '../../lib/qr';

export default function QrCard({ id, host }: { id: string; host?: string }) {
  const url = projectUrl(id, host);
  return <div className="qr-card"><img src={qrImageUrl(url)} alt={`QR code for project ${id}`} /><strong>Scan for {id}</strong><small>{url}</small></div>;
}
