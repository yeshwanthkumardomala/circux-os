'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';
import { defaultProjects, type Project } from '../../lib/project-data';
import { loadLocal } from '../../lib/storage';
import { searchProjects } from '../../lib/project-search';
import { supabase, supabaseConfigured } from '../../lib/supabase-browser';

type SearchHit = { resource_type: string; resource_id: string; project_id: string | null; title: string; details: string; href: string };

type Props = {
  projects?: Project[];
  onSelect?: (project: Project) => void;
  placeholder?: string;
  compact?: boolean;
};

export default function GlobalProjectSearch({ projects, onSelect, placeholder = 'Search all projects, teams, IDs…', compact = false }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [localProjects, setLocalProjects] = useState<Project[]>(projects || defaultProjects);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cloudResults, setCloudResults] = useState<SearchHit[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searching, setSearching] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projects) {
      setLocalProjects(projects);
      return;
    }
    setLocalProjects(loadLocal<Project[]>('circux-projects', defaultProjects).filter(project => !project.hidden));
  }, [projects]);

  const results = useMemo(() => searchProjects(localProjects, query), [localProjects, query]);
  useEffect(() => {
    if (!supabaseConfigured || !supabase || !query.trim()) { setCloudResults([]); setSearchError(''); return; }
    const timer = window.setTimeout(() => {
      setSearching(true);
      void Promise.resolve(supabase!.auth.getSession()).then(({ data }) => data.session
        ? supabase!.rpc('search_circux_resources', { p_query: query.trim(), p_limit: 30, p_offset: 0 })
        : supabase!.rpc('search_public_projects', { p_query: query.trim(), p_limit: 20 }))
        .then(({ data, error }) => { setCloudResults((data || []) as SearchHit[]); setSearchError(error?.message || ''); })
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

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
    else router.push('/project/' + encodeURIComponent(project.id));
  };
  const hits = supabaseConfigured ? cloudResults : results.map(project => ({ resource_type: 'project', resource_id: project.id, project_id: project.id, title: project.name, details: `${project.id} · ${project.team} · ${project.category} · ${project.status}`, href: `/project/${encodeURIComponent(project.id)}` }));
  const chooseHit = (hit: SearchHit) => {
    setQuery('');
    if (onSelect && hit.project_id) { const project = localProjects.find(item => item.id === hit.project_id); if (project) { onSelect(project); return; } }
    router.push(hit.href);
  };

  return (
    <div className={'global-search' + (compact ? ' global-search-compact' : '')} ref={rootRef}>
      <div className="search">
        <Search size={15} aria-hidden="true" />
        <input
          aria-label="Search all projects"
          aria-expanded={Boolean(query.trim())}
          aria-controls="global-project-search-results"
          aria-activedescendant={hits[activeIndex] ? `global-project-result-${hits[activeIndex].resource_id}` : undefined}
          aria-autocomplete="list"
          role="combobox"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' && hits.length) {
              event.preventDefault();
              setActiveIndex(index => (index + 1) % hits.length);
            } else if (event.key === 'ArrowUp' && hits.length) {
              event.preventDefault();
              setActiveIndex(index => (index - 1 + hits.length) % hits.length);
            } else if (event.key === 'Enter' && hits[activeIndex]) {
              event.preventDefault();
              chooseHit(hits[activeIndex]);
            }
          }}
          placeholder={placeholder}
        />
      </div>
      {query.trim() && (
        <div id="global-project-search-results" className="global-search-results" role="listbox" aria-label="Project search results">
          {searching ? <p role="status">Searching…</p> : searchError ? <p role="alert">Search unavailable: {searchError}</p> : hits.length ? hits.map((hit, index) => {
            const content = <><strong>{hit.title}</strong><small>{hit.resource_type} · {hit.details}</small></>;
            return onSelect ? (
              <button id={`global-project-result-${hit.resource_id}`} key={`${hit.resource_type}-${hit.resource_id}`} type="button" role="option" aria-selected={index === activeIndex} className={index === activeIndex ? 'active' : ''} onMouseEnter={() => setActiveIndex(index)} onClick={() => chooseHit(hit)}>{content}</button>
            ) : (
              <Link id={`global-project-result-${hit.resource_id}`} key={`${hit.resource_type}-${hit.resource_id}`} role="option" aria-selected={index === activeIndex} className={index === activeIndex ? 'active' : ''} href={hit.href} onMouseEnter={() => setActiveIndex(index)} onClick={() => setQuery('')}>{content}<ArrowRight size={13} aria-hidden="true" /></Link>
            );
          }) : <p role="status">No matching records.</p>}
        </div>
      )}
    </div>
  );
}
