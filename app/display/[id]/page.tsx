import { defaultProjects, getProject } from '../../../lib/project-data';
import DisplayDetailClient from './DisplayDetailClient';

export function generateStaticParams() { return defaultProjects.map(project => ({ id: project.id })); }

export default function DisplayPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  return <DisplayDetailClient id={id} initialProject={getProject(id)} />;
}
