'use client';

import { useEffect, useState } from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { relayRequest, relayUrl } from '../../lib/relay';
import { loadLocal, saveLocal } from '../../lib/storage';

type UploadItem = { id?: string; name: string; size?: number; type?: string };
export default function UploadsPanel() {
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => { relayRequest<UploadItem[]>('/uploads').then(setFiles).catch(() => setFiles(loadLocal('circux-upload-names', []).map(name => ({ name })))); }, []);
  const add = (event: React.ChangeEvent<HTMLInputElement>) => { Array.from(event.target.files || []).forEach(file => { const reader = new FileReader(); reader.onload = () => { const data = String(reader.result); relayRequest<UploadItem>('/uploads', { method: 'POST', body: JSON.stringify({ name: file.name, type: file.type, data }) }).then(item => setFiles(current => [...current, item])).catch(() => { const next = [...files, { name: file.name, size: file.size, type: file.type }]; setFiles(next); saveLocal('circux-upload-names', next.map(item => item.name)); setMessage('Relay offline; only the filename was saved locally.'); }); }; reader.readAsDataURL(file); }); };
  const remove = (item: UploadItem) => { const next = files.filter(file => file.id !== item.id && file.name !== item.name); setFiles(next); saveLocal('circux-upload-names', next.map(file => file.name)); if (item.id) relayRequest(`/uploads/${item.id}`, { method: 'DELETE' }).catch(() => undefined); };
  return <><div className="page-head"><div><div className="eyebrow">Project assets</div><h1>Uploads</h1><p>Files are stored by the relay backend when it is running.</p></div><label className="btn primary"><Upload size={14} /> Choose files<input type="file" multiple hidden onChange={add} /></label></div><div className="card"><div className="callout" style={{ marginBottom: 16 }}>{message || 'The backend stores file bytes in .circux-data/uploads.'}</div>{files.length ? files.map(item => <div className="project-row" key={item.id || item.name}><div className="project-icon"><FileText size={16} /></div><div style={{ flex: 1 }}><strong style={{ fontSize: 12 }}>{item.id ? <a href={relayUrl(`/uploads/file/${item.id}`)} target="_blank" rel="noreferrer">{item.name}</a> : item.name}</strong><div className="project-meta">{item.type || 'Local reference'}{item.size ? ` · ${Math.ceil(item.size / 1024)} KB` : ''}</div></div><button className="icon-btn" onClick={() => remove(item)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div>) : <div className="empty"><Upload size={30} /><h3>No project assets yet</h3><p>Upload project images, PDFs, reports, or presentation files.</p></div>}</div></>;
}
