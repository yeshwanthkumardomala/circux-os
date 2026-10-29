import type { Project } from './project-data';

export function searchProjects(projects: Project[], query: string, limit = 8): Project[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term || !Number.isFinite(limit) || limit <= 0) return [];
  return projects.filter(project =>
    [project.name, project.team, project.category, project.summary, project.id, project.status]
      .some(value => value.toLocaleLowerCase().includes(term))
  ).slice(0, Math.floor(limit));
}
