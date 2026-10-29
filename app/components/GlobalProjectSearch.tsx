'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { defaultProjects, type Project } from '../../lib/project-data';
import { loadLocal } from '../../lib/storage';

type Props = {
  projects?: Project[];
  onSelect?: (project: Project) => void;
  placeholder?: string;
  compact?: boolean;
};

export default function GlobalProjectSearch({ projects, onSelect, placeholder = 'Search all projects, teams, IDs…', compact = false }: Props) {
  const [query, setQuery] = useState('');
  const [localProjects, setLocalProjects] = useState<Project[]>(projects || defaultProjects);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects) {
      setLocalProjects(projects);
      return;
    }
    setLocalProjects(loadLocal<Project[]>('circux-projects', defaultProjects));
  }, [projects]);

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    return localProjects.filter(project =>
      [project.name, project.team, project.category, project.summary, project.id, project.status]
        .some(value => value.toLocaleLowerCase().includes(term))
    ).slice(0, 8);
  }, [localProjects, query]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setQuery('');
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuery('');
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const choose = (project: Project) => {
    setQuery('');
    if (onSelect) onSelect(project);
  };

  return (
    <div className={'global-search' + (compact ? ' global-search-compact' : '')} ref={rootRef}>
      <div className="search">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label="Search all projects"
          aria-expanded={Boolean(query.trim())}
          aria-controls="global-project-search-results"
          aria-autocomplete="list"
          role="combobox"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' && results.length) {
              event.preventDefault();
              setActiveIndex(index => (index + 1) % results.length);
            } else if (event.key === 'ArrowUp' && results.length) {
              event.preventDefault();
              setActiveIndex(index => (index - 1 + results.length) % results.length);
            } else if (event.key === 'Enter' && results[activeIndex]) {
              event.preventDefault();
              choose(results[activeIndex]);
            }
          }}
          placeholder={placeholder}
        />
      </div>
      {query.trim() && (
        <div id="global-project-search-results" className="global-search-results" role="listbox" aria-label="Project search results">
          {results.length ? results.map((project, index) => {
            const content = <><strong>{project.name}</strong><small>{project.id} · {project.team} · {project.category} · {project.status}</small></>;
            return onSelect ? (
              <button key={project.id} type="button" role="option" aria-selected={index === activeIndex} className={index === activeIndex ? 'active' : ''} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(project)}>{content}</button>
            ) : (
              <Link key={project.id} role="option" aria-selected={index === activeIndex} className={index === activeIndex ? 'active' : ''} href={'/project/' + encodeURIComponent(project.id)} onMouseEnter={() => setActiveIndex(index)} onClick={() => setQuery('')}>{content}<ArrowRight size={13} aria-hidden="true" /></Link>
            );
          }) : <p role="status">No matching projects. Try a project ID, team, category, or keyword.</p>}
        </div>
      )}
    </div>
  );
}
