import { defaultProjects, getProject } from '../../../lib/project-data';
import DisplayDetailClient from './DisplayDetailClient';
import { supabaseConfigured } from '../../../lib/supabase-browser';

export function generateStaticParams() {
  return supabaseConfigured ? [] : defaultProjects.map(project => ({ id: project.id }));
}

export default async function DisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  return <DisplayDetailClient id={id} initialProject={supabaseConfigured ? null : getProject(id)} />;
}
