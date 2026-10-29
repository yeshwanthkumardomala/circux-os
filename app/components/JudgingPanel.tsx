'use client';

import { useEffect, useState } from 'react';
import { Download, Trophy } from 'lucide-react';
import type { Project } from '../../lib/project-data';
import { relayRequest } from '../../lib/relay';
import { downloadFile, loadLocal, saveLocal, toCsv } from '../../lib/storage';

type RecordItem = { id: string; projectId: string; scores: number[]; feedback: string; createdAt: string };
const criteria: [string, number][] = [['Innovation', 25], ['Technical implementation', 25], ['Problem relevance', 20], ['Presentation', 15], ['Social or environmental impact', 15]];

export default function JudgingPanel({ project, projects = [] }: { project: Project | null; projects?: Project[]; onSelect?: (project: Project) => void }) {
  const active = project || projects[0] || { id: 'CX-104', name: 'Aqua Smart Irrigation' } as Project;
  const [scores, setScores] = useState([20, 20, 15, 12, 12]);
  const [feedback, setFeedback] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [message, setMessage] = useState('');
  const total = scores.reduce((sum, score) => sum + score, 0);
  useEffect(() => { relayRequest<RecordItem[]>('/judging').then(setRecords).catch(() => setRecords(loadLocal('circux-judging', []))); }, []);
  const submit = () => { const record = { projectId: active.id, scores, feedback, createdAt: new Date().toISOString() }; relayRequest<RecordItem>('/judging', { method: 'POST', body: JSON.stringify(record) }).then(saved => { setRecords(current => [...current, saved]); setMessage('Evaluation saved to the relay backend.'); }).catch(() => { const local = [...records, { ...record, id: crypto.randomUUID() }]; setRecords(local); saveLocal('circux-judging', local); setMessage('Relay offline; evaluation saved in this browser.'); }); };
  return <><div className="page-head"><div><div className="eyebrow">Competition scoring</div><h1>Judging sheets</h1><p>Scores are saved to the relay when available and locally as a fallback.</p></div><button className="btn" onClick={() => downloadFile('circux-judging-sheet.csv', toCsv([['Criterion', 'Maximum', 'Score'], ...criteria.map((item, index) => [item[0], item[1], scores[index]]), ['Total', 100, total]]), 'text/csv')}><Download size={14} /> Export sheet</button></div><div className="split"><section className="card"><div className="card-head"><h3>{active.name} · {active.id}</h3><span className={`badge ${total >= 70 ? 'green' : 'amber'}`}>{total} / 100</span></div>{criteria.map((item, index) => <div className="score-row" key={item[0]}><div style={{ flex: 1 }}><strong>{item[0]}</strong><div className="muted">Maximum {item[1]} points</div></div><input type="number" min="0" max={item[1]} value={scores[index]} onChange={event => setScores(current => current.map((value, position) => position === index ? Math.min(item[1], Math.max(0, Number(event.target.value) || 0)) : value))} /></div>)}<div className="field"><label>Written feedback</label><textarea value={feedback} onChange={event => setFeedback(event.target.value)} placeholder="What worked well? What should the team improve?" /></div><button className="btn primary" onClick={submit}>Submit evaluation</button>{message && <p className="muted">{message}</p>}</section><section className="card"><div className="card-head"><h3>Saved evaluations</h3><Trophy size={16} color="var(--amber)" /></div>{records.length ? records.slice(-8).reverse().map(record => <div className="kpi" key={record.id}><span>{record.projectId}<small>{new Date(record.createdAt).toLocaleString()}</small></span><strong>{record.scores.reduce((sum, score) => sum + score, 0)}</strong></div>) : <p className="muted">No saved evaluations yet.</p>}</section></div></>;
}
