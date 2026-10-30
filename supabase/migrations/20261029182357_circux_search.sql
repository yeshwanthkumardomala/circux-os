create or replace function public.search_circux_resources(p_query text, p_limit integer default 30, p_offset integer default 0)
returns table (resource_type text, resource_id text, project_id text, title text, details text, href text)
language sql stable security invoker set search_path = '' as $$
  with q as (select left(trim(coalesce(p_query, '')), 160) as value), results as (
    select 'project'::text as resource_type, p.id as resource_id, p.id as project_id, p.name as title, left(coalesce(p.data->>'summary', p.data->>'category', ''), 240) as details, '/project/' || p.id as href
    from public.projects p, q where q.value <> '' and (p.name ilike '%' || q.value || '%' or p.data::text ilike '%' || q.value || '%')
    union all
    select 'participant', m.id::text, m.project_id, m.name, m.role, '/project/' || m.project_id
    from public.project_members m, q where q.value <> '' and (m.name ilike '%' || q.value || '%' or m.role ilike '%' || q.value || '%')
    union all
    select 'documentation', d.id::text, d.project_id, d.title, left(d.content, 240), '/project/' || d.project_id
    from public.project_documents d, q where q.value <> '' and (d.title ilike '%' || q.value || '%' or d.content ilike '%' || q.value || '%')
    union all
    select 'judging', j.id::text, j.project_id, coalesce(p.name, j.project_id) || ' judging', left(j.feedback, 240), '/project/' || j.project_id
    from public.judging_records j join public.projects p on p.id = j.project_id, q
    where q.value <> '' and (j.feedback ilike '%' || q.value || '%' or p.name ilike '%' || q.value || '%')
    union all
    select 'exhibition', e.id::text, null::text, e.display_name, 'Display pairing', '/display'
    from public.exhibition_pairings e, q where q.value <> '' and e.display_name ilike '%' || q.value || '%'
  )
  select r.* from results r
  order by case when lower(r.title) = lower(trim(p_query)) then 0 when r.title ilike trim(p_query) || '%' then 1 else 2 end, r.title
  limit least(greatest(coalesce(p_limit, 30), 1), 50) offset greatest(coalesce(p_offset, 0), 0);
$$;
revoke all on function public.search_circux_resources(text, integer, integer) from public, anon;
grant execute on function public.search_circux_resources(text, integer, integer) to authenticated;

