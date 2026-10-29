import { defaultProjects, getProject } from '../../../lib/project-data';
import ProjectDetailClient from './ProjectDetailClient';

export function generateStaticParams() { return defaultProjects.map(project => ({ id: project.id })); }

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  return <ProjectDetailClient id={id} initialProject={getProject(id)} />;
}
