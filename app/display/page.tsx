import Link from 'next/link';
import { CircuitBoard, Play, Users } from 'lucide-react';
import { getProject } from '../../lib/project-data';

export default function TwoProjectDisplay({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = (searchParams.ids || 'CX-104,CX-106').split(',').slice(0, 2);
  const projects = ids.map(id => getProject(decodeURIComponent(id))).filter(Boolean);
  return <main className="display-page"><header className="display-header"><span>CIRCUX OS · TWO PROJECT DISPLAY</span><Link href="/">Workspace</Link></header><div className="display-compare">{projects.map(project => { const details = project!.details!; return <section className="display-compare-card" key={project!.id}><div className="display-eyebrow">{project!.category} · {project!.id}</div><h1>{project!.name}</h1><p>{project!.summary}</p><div className="display-tags"><span>{project!.team}</span><span>{project!.progress}% prepared</span></div><div className="display-mini-grid"><div><h2><CircuitBoard size={17} /> Readings</h2>{details.readings.map(reading => <div className="display-reading" key={reading.label}><span>{reading.label}</span><strong>{reading.value}</strong></div>)}</div><div><h2><Users size={17} /> Team</h2>{details.members.map(member => <div className="display-member" key={member.name}><strong>{member.name}</strong><span>{member.role}</span></div>)}</div></div><Link className="display-link" href={`/display/${project!.id}`}>Open full display →</Link></section>; })}</div><footer>Two-project comparison mode · sample data · no hardware connected</footer></main>;
}
