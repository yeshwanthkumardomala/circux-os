'use client';

import { useEffect, useState } from 'react';
import { Download, Trophy } from 'lucide-react';
import type { Project } from '../../lib/project-data';
import { relayRequest } from '../../lib/relay';
import { downloadFile, loadLocal, saveLocal, toCsv } from '../../lib/storage';
import { supabase, supabaseConfigured } from '../../lib/supabase-browser';
import { useCircuxAuth } from './AuthGate';

type RecordItem = { id: string; projectId: string; scores: number[]; feedback: string; createdAt: string };
const criteria: [string, number][] = [['Innovation', 25], ['Technical implementation', 25], ['Problem relevance', 20], ['Presentation', 15], ['Social or environmental impact', 15]];

export default function JudgingPanel({ project, projects = [], onSelect }: { project: Project | null; projects?: Project[]; onSelect?: (project: Project) => void }) {
  const active = project || projects[0] || null;
  const { user } = useCircuxAuth();
  const [scores, setScores] = useState([0, 0, 0, 0, 0]);
  const [feedback, setFeedback] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [message, setMessage] = useState('');
  const total = scores.reduce((sum, score) => sum + score, 0);
  useEffect(() => { setScores([0, 0, 0, 0, 0]); setFeedback(''); }, [active.id]);
  useEffect(() => {
    if (supabaseConfigured && supabase) { if (!user) return; void supabase.from('judging_records').select('id,project_id,scores,feedback,created_at').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) setMessage(`Could not load evaluations: ${error.message}`); else setRecords((data || []).map(row => ({ id: row.id, projectId: row.project_id, scores: row.scores as number[], feedback: row.feedback, createdAt: row.created_at }))); }); return; }
    relayRequest<RecordItem[]>('/judging').then(setRecords).catch(() => setRecords(loadLocal('circux-judging', [])));
  }, [user]);
  const submit = async () => {
    if (!active) return;
    if (scores.some((score, index) => !Number.isFinite(score) || score < 0 || score > criteria[index][1])) { setMessage('Each score must be within its criterion limit.'); return; }
    const createdAt = new Date().toISOString();
    if (supabaseConfigured && supabase) {
      if (!user) { setMessage('Sign in before submitting an evaluation.'); return; }
      const { data, error } = await supabase.from('judging_records').insert({ project_id: active.id, judge_id: user.id, scores, feedback }).select('id,project_id,scores,feedback,created_at').single();
      if (error) { setMessage(`Evaluation was not saved: ${error.message}`); return; }
      setRecords(current => [{ id: data.id, projectId: data.project_id, scores: data.scores as number[], feedback: data.feedback, createdAt: data.created_at }, ...current]); setMessage('Evaluation saved.'); return;
    }
    const record = { projectId: active.id, scores, feedback, createdAt };
    relayRequest<RecordItem>('/judging', { method: 'POST', body: JSON.stringify(record) }).then(saved => { setRecords(current => [...current, saved]); setMessage('Evaluation saved to the relay backend.'); }).catch(() => { const local = [...records, { ...record, id: crypto.randomUUID() }]; setRecords(local); saveLocal('circux-judging', local); setMessage('Relay offline; evaluation saved in this browser.'); });
  };
  if (!active) return <div className="empty"><h2>No project available</h2><p>Create or select a project before judging.</p></div>;
  return <><div className="page-head"><div><div className="eyebrow">Competition scoring</div><h1>Judging sheets</h1><p>Scores are saved to the relay when available and locally as a fallback.</p></div><div className="actions">{projects.length > 0 && <select aria-label="Project to judge" value={active.id} onChange={event => { const selected = projects.find(item => item.id === event.target.value); if (selected) onSelect?.(selected); }}>{projects.map(item => <option key={item.id} value={item.id}>{item.id} ? {item.name}</option>)}</select>}<button className="btn" onClick={() => downloadFile('circux-judging-sheet.csv', toCsv([['Criterion', 'Maximum', 'Score'], ...criteria.map((item, index) => [item[0], item[1], scores[index]]), ['Total', 100, total]]), 'text/csv')}><Download size={14} /> Export sheet</button></div></div><div className="split"><section className="card"><div className="card-head"><h3>{active.name} · {active.id}</h3><span className={`badge ${total >= 70 ? 'green' : 'amber'}`}>{total} / 100</span></div>{criteria.map((item, index) => <div className="score-row" key={item[0]}><div style={{ flex: 1 }}><strong>{item[0]}</strong><div className="muted">Maximum {item[1]} points</div></div><input type="number" min="0" max={item[1]} value={scores[index]} onChange={event => setScores(current => current.map((value, position) => position === index ? Math.min(item[1], Math.max(0, Number(event.target.value) || 0)) : value))} /></div>)}<div className="field"><label>Written feedback</label><textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="What worked well? What should the team improve?" /></div><button className="btn primary" onClick={submit}>Submit evaluation</button>{message && <p className="muted">{message}</p>}</section><section className="card"><div className="card-head"><h3>Saved evaluations</h3><Trophy size={16} color="var(--amber)" /></div>{records.length ? records.slice(-8).reverse().map(record => <div className="kpi" key={record.id}><span>{record.projectId}<small>{new Date(record.createdAt).toLocaleString()}</small></span><strong>{record.scores.reduce((sum, score) => sum + score, 0)}</strong></div>) : <p className="muted">No saved evaluations yet.</p>}</section></div></>;
}
