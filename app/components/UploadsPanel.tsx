'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Download, ExternalLink, FileText, Link2, Trash2, Upload, X } from 'lucide-react';
import type { Project } from '../../lib/project-data';
import { relayFetch, relayRequest } from '../../lib/relay';
import { loadLocal, saveLocal } from '../../lib/storage';
import { supabase, supabaseConfigured } from '../../lib/supabase-browser';

type UploadItem = { id?: string; name: string; size?: number; type?: string; projectId?: string | null };
const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error(`Could not read ${file.name}`)); reader.readAsDataURL(file); });
const allowedTypes: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', mp4: 'video/mp4', webm: 'video/webm' };

export default function UploadsPanel({ projects, onProjectsChange }: { projects: Project[]; onProjectsChange: (projects: Project[]) => void }) {
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [projectId, setProjectId] = useState(projects[0]?.id || '_unassigned');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const active = projects.find(project => project.id === projectId);
  const links = useMemo(() => active?.details?.media?.documents || [], [active]);

  useEffect(() => {
    if (supabaseConfigured && supabase) { void supabase.from('uploads').select('id,file_name,byte_size,content_type,project_id').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) setMessage(`Could not load uploads: ${error.message}`); else setFiles((data || []).map(row => ({ id: row.id, name: row.file_name, size: Number(row.byte_size), type: row.content_type, projectId: row.project_id }))); }); return; }
    relayRequest<UploadItem[]>('/uploads').then(setFiles).catch(() => setFiles(loadLocal<string[]>('circux-upload-names', []).map(name => ({ name }))));
  }, []);
  useEffect(() => { if (projectId !== '_unassigned' && !projects.some(project => project.id === projectId)) setProjectId(projects[0]?.id || '_unassigned'); }, [projectId, projects]);

  const addFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    setBusy(true);
    for (const file of selected) {
      if (file.size > 10 * 1024 * 1024) { setMessage(`${file.name} exceeds the 10 MB limit.`); continue; }
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedTypes[extension]) { setMessage(`${file.name} is not a supported file type.`); continue; }
      const contentType = allowedTypes[extension];
      try {
        if (supabaseConfigured && supabase) {
          const { data: auth } = await supabase.auth.getUser();
          if (!auth.user) throw new Error('Sign in is required to upload files.');
          const path = `${auth.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage.from('circux-project-files').upload(path, file, { contentType });
          if (uploadError) throw uploadError;
          const { data, error } = await supabase.from('uploads').insert({ project_id: active?.id || null, storage_path: path, file_name: file.name, content_type: contentType, byte_size: file.size, uploaded_by: auth.user.id }).select('id,file_name,byte_size,content_type,project_id').single();
          if (error) { await supabase.storage.from('circux-project-files').remove([path]); throw error; }
          setFiles(current => [{ id: data.id, name: data.file_name, size: Number(data.byte_size), type: data.content_type, projectId: data.project_id }, ...current]); setMessage(`${file.name} uploaded securely.`); continue;
        }
        const item = await relayRequest<UploadItem>('/uploads', { method: 'POST', body: JSON.stringify({ name: file.name, type: contentType, data: await toDataUrl(file), projectId: active?.id }) });
        setFiles(current => [...current, item]);
        setMessage(`${file.name} saved in the local backend project folder.`);
      } catch (error) {
        if (supabaseConfigured) { setMessage(`${file.name}: ${error instanceof Error ? error.message : 'Upload failed.'}`); continue; }
        setFiles(current => [...current, { name: file.name, size: file.size, type: file.type, projectId: active?.id }]);
        const localNames = loadLocal<string[]>('circux-upload-names', []);
        if (!localNames.includes(file.name)) saveLocal('circux-upload-names', [...localNames, file.name]);
        setMessage(error instanceof Error ? `${file.name}: backend unavailable; only its name was saved in this browser.` : `${file.name}: upload failed.`);
      }
    }
    setBusy(false);
  };

  const addLink = async (event: FormEvent) => {
    event.preventDefault();
    if (!active || !title.trim()) return;
    let parsed: URL;
    try { parsed = new URL(url); } catch { setMessage('Enter a valid http or https link.'); return; }
    if (!['http:', 'https:'].includes(parsed.protocol)) { setMessage('Only http and https links are supported.'); return; }
    const detail = active.details || { members: [], readings: [], documents: [], circuit: '', video: '' };
    const media = detail.media || { photos: [], documents: [], videos: [] };
    const updated = { ...active, details: { ...detail, media: { ...media, documents: [...media.documents, { title: title.trim(), url: parsed.toString() }] } } };
    onProjectsChange(projects.map(project => project.id === active.id ? updated : project));
    if (!supabaseConfigured) saveLocal('circux-projects', projects.map(project => project.id === active.id ? updated : project));
    setTitle(''); setUrl('');
    if (supabaseConfigured) { setMessage('Project link saved.'); return; }
    try { await relayRequest(`/projects/${encodeURIComponent(active.id)}`, { method: 'PUT', body: JSON.stringify(updated) }); setMessage('Project link saved to the local backend.'); }
    catch { setMessage('Link saved in this browser; relay sync is unavailable.'); }
  };

  const removeLink = (link: { title: string; url: string }) => {
    if (!active) return;
    const detail = active.details || { members: [], readings: [], documents: [], circuit: '', video: '' };
    const media = detail.media || { photos: [], documents: [], videos: [] };
    const updated = { ...active, details: { ...detail, media: { ...media, documents: media.documents.filter(item => item !== link) } } };
    const next = projects.map(project => project.id === active.id ? updated : project);
    onProjectsChange(next); if (!supabaseConfigured) saveLocal('circux-projects', next);
    if (supabaseConfigured) { setMessage('Project link removed.'); return; }
    relayRequest(`/projects/${encodeURIComponent(active.id)}`, { method: 'PUT', body: JSON.stringify(updated) }).then(() => setMessage('Link removed.')).catch(() => setMessage('Link removed in this browser; relay sync is unavailable.'));
  };

  const openFile = async (item: UploadItem) => {
    if (!item.id) return;
    try {
      if (supabaseConfigured && supabase) {
        const { data: row, error: lookupError } = await supabase.from('uploads').select('storage_path').eq('id', item.id).single(); if (lookupError) throw lookupError;
        const { data, error } = await supabase.storage.from('circux-project-files').download(row.storage_path); if (error) throw error;
        const objectUrl = URL.createObjectURL(data); const link = document.createElement('a'); link.href = objectUrl; link.download = item.name; link.click(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000); return;
      }
      const response = await relayFetch(`/uploads/file/${encodeURIComponent(item.id)}`);
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Download failed');
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = objectUrl; link.download = item.name; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to download file.'); }
  };

  const removeFile = async (item: UploadItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    if (item.id && supabaseConfigured && supabase) {
      const { data: row, error: lookupError } = await supabase.from('uploads').select('storage_path').eq('id', item.id).single(); if (lookupError) { setMessage(lookupError.message); return; }
      const { error: fileError } = await supabase.storage.from('circux-project-files').remove([row.storage_path]); if (fileError) { setMessage(fileError.message); return; }
      const { error } = await supabase.from('uploads').delete().eq('id', item.id); if (error) { setMessage(`File deleted but metadata remains: ${error.message}`); return; }
    } else if (item.id) {
      try { await relayRequest(`/uploads/${encodeURIComponent(item.id)}`, { method: 'DELETE' }); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'Delete failed; file was kept.'); return; }
    }
    setFiles(current => current.filter(file => file.id !== item.id || file.name !== item.name));
    if (!supabaseConfigured) saveLocal('circux-upload-names', files.filter(file => file.id !== item.id || file.name !== item.name).map(file => file.name));
    setMessage(`${item.name} deleted.`);
  };

  const visibleFiles = files.filter(item => projectId === '_unassigned' ? !item.projectId : item.projectId === projectId);
  return <><div className="page-head"><div><div className="eyebrow">Project library</div><h1>Files, documents & links</h1><p>Organize uploads by project. The local relay stores file contents in a project-specific backend folder.</p></div><label className={`btn primary${busy ? ' disabled' : ''}`}><Upload size={14} /> {busy ? 'Uploading…' : 'Choose files'}<input type="file" multiple hidden disabled={busy} onChange={event => void addFiles(event)} /></label></div>
    <section className="card asset-toolbar"><label className="field">Project folder<select value={projectId} onChange={event => setProjectId(event.target.value)}><option value="_unassigned">Unassigned files</option>{projects.map(project => <option key={project.id} value={project.id}>{project.id} · {project.name}</option>)}</select></label><div className="callout">Backend folder: <code>.circux-data/uploads/{active?.id || '_unassigned'}/</code>. Files are retained on the event computer; offline browser fallback keeps filenames only.</div></section>
    <div className="asset-layout"><section className="card"><div className="card-head"><h2><FileText size={17} /> Project files</h2><span className="badge blue">{visibleFiles.length} files</span></div>{visibleFiles.length ? visibleFiles.map(item => <div className="project-row" key={item.id || `${item.projectId}-${item.name}`}><div className="project-icon"><FileText size={16} /></div><div className="asset-info"><strong>{item.id ? <button className="text-button" onClick={() => void openFile(item)}>{item.name}</button> : item.name}</strong><small>{item.type || 'Local file reference'}{item.size ? ` · ${Math.ceil(item.size / 1024)} KB` : ''}</small></div>{item.id && <button className="icon-btn" onClick={() => void openFile(item)} aria-label={`Download ${item.name}`}><Download size={15} /></button>}<button className="icon-btn danger-text" onClick={() => void removeFile(item)} aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button></div>) : <div className="empty"><Upload size={28} /><h3>No files in this folder</h3><p>Select files to upload them to the local project folder.</p></div>}</section>
      <section className="card"><div className="card-head"><h2><Link2 size={17} /> Project links</h2><span className="badge gray">Saved with project</span></div>{active ? <><form className="link-form" onSubmit={event => void addLink(event)}><label className="field">Link title<input required value={title} onChange={event => setTitle(event.target.value)} placeholder="Project report or demo" /></label><label className="field">URL<input required type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://…" /></label><button className="btn primary" type="submit">Add link</button></form>{links.map(link => <div className="project-row" key={`${link.title}-${link.url}`}><a className="asset-info text-button" href={link.url} target="_blank" rel="noopener noreferrer"><strong>{link.title}</strong><small>{link.url}</small><ExternalLink size={13} /></a><button className="icon-btn danger-text" onClick={() => removeLink(link)} aria-label={`Remove ${link.title}`}><X size={15} /></button></div>)}{!links.length && <p className="muted">No links added for this project yet.</p>}</> : <p className="muted">Create or select a project to manage its links.</p>}</section></div>{message && <p className="asset-message" role="status">{message}</p>}</>;
}
