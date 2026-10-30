create or replace function public.search_public_projects(p_query text, p_limit integer default 20)
returns table (resource_type text, resource_id text, project_id text, title text, details text, href text)
language sql stable security invoker set search_path = '' as $$
  select 'project'::text, p.id, p.id, p.name,
    left(coalesce(p.data->>'summary',p.data->>'category',''),240), '/project/' || p.id
  from public.projects p
  where p.is_public and not p.is_archived and length(trim(coalesce(p_query,''))) > 0
    and (p.name ilike '%' || left(trim(p_query),160) || '%' or p.data::text ilike '%' || left(trim(p_query),160) || '%')
  order by case when lower(p.name)=lower(trim(p_query)) then 0 when p.name ilike trim(p_query) || '%' then 1 else 2 end, p.name
  limit least(greatest(coalesce(p_limit,20),1),30);
$$;
revoke all on function public.search_public_projects(text,integer) from public;
grant execute on function public.search_public_projects(text,integer) to anon, authenticated;
