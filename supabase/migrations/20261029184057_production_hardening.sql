create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

alter function public.is_circux_staff() set schema private;
alter function public.is_circux_admin() set schema private;
alter function public.is_circux_judge() set schema private;
revoke all on function public.create_circux_profile() from public, anon, authenticated;

revoke select on public.project_members, public.project_documents, public.uploads from anon;

create index if not exists audit_events_actor_idx on public.audit_events(actor_id);
create index if not exists exhibition_pairings_created_by_idx on public.exhibition_pairings(created_by);
create index if not exists hardware_boards_created_by_idx on public.hardware_boards(created_by);
create index if not exists hardware_boards_project_idx on public.hardware_boards(project_id);
create index if not exists project_documents_updated_by_idx on public.project_documents(updated_by);
create index if not exists projects_created_by_idx on public.projects(created_by);
create index if not exists projects_updated_by_idx on public.projects(updated_by);
create index if not exists uploads_uploaded_by_idx on public.uploads(uploaded_by);
create index if not exists workspace_settings_updated_by_idx on public.workspace_settings(updated_by);

create or replace function private.valid_circux_scores(value jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare limits numeric[] := array[25,25,20,15,15]; item jsonb; score numeric; i integer := 0;
begin
  if jsonb_typeof(value) <> 'array' or jsonb_array_length(value) <> 5 then return false; end if;
  for item in select jsonb_array_elements(value) loop
    i := i + 1;
    if jsonb_typeof(item) <> 'number' then return false; end if;
    score := (item #>> '{}')::numeric;
    if score < 0 or score > limits[i] then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;
grant execute on function private.valid_circux_scores(jsonb) to authenticated;
alter table public.judging_records add constraint judging_scores_valid
  check (private.valid_circux_scores(scores)) not valid;
alter table public.judging_records validate constraint judging_scores_valid;

create or replace function private.sync_project_records()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.project_members m where m.project_id = new.id and not exists (
    select 1 from jsonb_array_elements(case when jsonb_typeof(new.data #> '{details,members}')='array' then new.data #> '{details,members}' else '[]'::jsonb end) x
    where x->>'name' = m.name and coalesce(x->>'role','') = m.role
  );
  insert into public.project_members(project_id,name,role)
  select new.id, left(x->>'name',160), coalesce(x->>'role','')
  from jsonb_array_elements(case when jsonb_typeof(new.data #> '{details,members}')='array' then new.data #> '{details,members}' else '[]'::jsonb end) x
  where nullif(trim(x->>'name'),'') is not null
    and not exists (select 1 from public.project_members m where m.project_id=new.id and m.name=left(x->>'name',160) and m.role=coalesce(x->>'role',''));

  delete from public.project_documents d where d.project_id = new.id and not (jsonb_typeof(new.data->'report')='object' and (new.data->'report') ? d.section_key);
  insert into public.project_documents(project_id,section_key,title,content,is_published,updated_by)
  select new.id, left(key,80), left(key,160), left(coalesce(value #>> '{}',''),100000), new.is_public, new.updated_by
  from jsonb_each(case when jsonb_typeof(new.data->'report')='object' then new.data->'report' else '{}'::jsonb end)
  on conflict(project_id,section_key) do update set title=excluded.title, content=excluded.content,
    is_published=excluded.is_published, updated_by=excluded.updated_by, updated_at=now();
  return new;
end;
$$;
revoke all on function private.sync_project_records() from public, anon, authenticated;
drop trigger if exists projects_sync_records on public.projects;
create trigger projects_sync_records after insert or update of data,is_public on public.projects
for each row execute function private.sync_project_records();

create or replace function private.record_circux_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(actor_id,action,resource_type,resource_id)
  values (auth.uid(), lower(tg_op), tg_table_name,
    case when tg_op='DELETE' then coalesce(to_jsonb(old)->>'id',to_jsonb(old)->>'project_id')
         else coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'project_id') end);
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function private.record_circux_audit() from public, anon, authenticated;
drop trigger if exists circux_audit_projects on public.projects;
create trigger circux_audit_projects after insert or update or delete on public.projects
for each row execute function private.record_circux_audit();
drop trigger if exists circux_audit_judging on public.judging_records;
create trigger circux_audit_judging after insert on public.judging_records
for each row execute function private.record_circux_audit();
drop trigger if exists circux_audit_settings on public.workspace_settings;
create trigger circux_audit_settings after insert or update on public.workspace_settings
for each row execute function private.record_circux_audit();
