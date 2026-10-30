import { defaultProjects, getProject } from '../../../lib/project-data';
import ProjectDetailClient from './ProjectDetailClient';
import { supabaseConfigured } from '../../../lib/supabase-browser';

export function generateStaticParams() { return supabaseConfigured ? [] : defaultProjects.map(project => ({ id: project.id })); }

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  return <ProjectDetailClient id={id} initialProject={supabaseConfigured ? null : getProject(id)} />;
}
