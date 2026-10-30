import { defaultProjects, getProject } from '../../../lib/project-data';
import DisplayDetailClient from './DisplayDetailClient';
import { supabaseConfigured } from '../../../lib/supabase-browser';

export function generateStaticParams() { return supabaseConfigured ? [] : defaultProjects.map(project => ({ id: project.id })); }

export default function DisplayPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  return <DisplayDetailClient id={id} initialProject={supabaseConfigured ? null : getProject(id)} />;
}
