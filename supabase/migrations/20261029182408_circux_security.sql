alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_documents enable row level security;
alter table public.judging_records enable row level security;
alter table public.workspace_settings enable row level security;
alter table public.exhibition_pairings enable row level security;
alter table public.uploads enable row level security;
alter table public.hardware_boards enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.profiles, public.projects, public.project_members, public.project_documents,
  public.judging_records, public.workspace_settings, public.exhibition_pairings, public.uploads,
  public.hardware_boards, public.sensor_readings, public.audit_events from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (role, display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.projects, public.project_members, public.project_documents,
  public.workspace_settings, public.exhibition_pairings, public.uploads, public.hardware_boards to authenticated;
grant select, insert on public.judging_records to authenticated;
grant select, insert on public.sensor_readings to authenticated;
grant select on public.audit_events to authenticated;
grant select on public.projects, public.project_members, public.project_documents, public.uploads to anon;
grant usage, select on sequence public.sensor_readings_id_seq, public.audit_events_id_seq to authenticated;

drop policy if exists profiles_read_self_or_admin on public.profiles;
create policy profiles_read_self_or_admin on public.profiles for select to authenticated using (id = (select auth.uid()) or (select public.is_circux_admin()));
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using ((select public.is_circux_admin())) with check ((select public.is_circux_admin()));

drop policy if exists projects_read_published on public.projects;
create policy projects_read_published on public.projects for select to anon, authenticated using (is_public and not is_archived);
drop policy if exists projects_read_staff on public.projects;
create policy projects_read_staff on public.projects for select to authenticated using ((select public.is_circux_staff()));
drop policy if exists projects_staff_insert on public.projects;
create policy projects_staff_insert on public.projects for insert to authenticated with check ((select public.is_circux_staff()));
drop policy if exists projects_staff_update on public.projects;
create policy projects_staff_update on public.projects for update to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));
drop policy if exists projects_staff_delete on public.projects;
create policy projects_staff_delete on public.projects for delete to authenticated using ((select public.is_circux_staff()));

drop policy if exists project_members_read_published on public.project_members;
create policy project_members_read_published on public.project_members for select to anon, authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.is_public and not p.is_archived));
drop policy if exists project_members_read_staff on public.project_members;
create policy project_members_read_staff on public.project_members for select to authenticated using ((select public.is_circux_staff()));
drop policy if exists project_members_staff_write on public.project_members;
create policy project_members_staff_write on public.project_members for all to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));

drop policy if exists documents_read_published on public.project_documents;
create policy documents_read_published on public.project_documents for select to anon, authenticated using (is_published and exists (select 1 from public.projects p where p.id = project_id and p.is_public and not p.is_archived));
drop policy if exists documents_read_staff on public.project_documents;
create policy documents_read_staff on public.project_documents for select to authenticated using ((select public.is_circux_staff()));
drop policy if exists documents_staff_write on public.project_documents;
create policy documents_staff_write on public.project_documents for all to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));

drop policy if exists judging_read_staff_or_self on public.judging_records;
create policy judging_read_staff_or_self on public.judging_records for select to authenticated using ((select public.is_circux_staff()) or (select public.is_circux_judge()) and judge_id = (select auth.uid()));
drop policy if exists judging_insert_judge_or_staff on public.judging_records;
create policy judging_insert_judge_or_staff on public.judging_records for insert to authenticated with check (((select public.is_circux_staff())) or ((select public.is_circux_judge()) and judge_id = (select auth.uid())));

drop policy if exists settings_staff_read on public.workspace_settings;
create policy settings_staff_read on public.workspace_settings for select to authenticated using ((select public.is_circux_staff()));
drop policy if exists settings_staff_write on public.workspace_settings;
create policy settings_staff_write on public.workspace_settings for all to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));

drop policy if exists pairings_staff_read on public.exhibition_pairings;
create policy pairings_staff_read on public.exhibition_pairings for select to authenticated using ((select public.is_circux_staff()));
drop policy if exists pairings_staff_write on public.exhibition_pairings;
create policy pairings_staff_write on public.exhibition_pairings for all to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));

drop policy if exists uploads_read_public_project on public.uploads;
create policy uploads_read_public_project on public.uploads for select to anon, authenticated using (project_id is not null and exists (select 1 from public.projects p where p.id = project_id and p.is_public and not p.is_archived));
drop policy if exists uploads_read_staff on public.uploads;
create policy uploads_read_staff on public.uploads for select to authenticated using ((select public.is_circux_staff()));
drop policy if exists uploads_staff_write on public.uploads;
create policy uploads_staff_write on public.uploads for all to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));

drop policy if exists boards_staff_all on public.hardware_boards;
create policy boards_staff_all on public.hardware_boards for all to authenticated using ((select public.is_circux_staff())) with check ((select public.is_circux_staff()));
drop policy if exists readings_read_project on public.sensor_readings;
create policy readings_read_project on public.sensor_readings for select to anon, authenticated using (project_id is not null and exists (select 1 from public.projects p where p.id = project_id and p.is_public and not p.is_archived));
drop policy if exists readings_read_staff on public.sensor_readings;
create policy readings_read_staff on public.sensor_readings for select to authenticated using ((select public.is_circux_staff()) or ((select public.is_circux_judge()) and project_id in (select id from public.projects where is_public and not is_archived)));
drop policy if exists readings_staff_insert on public.sensor_readings;
create policy readings_staff_insert on public.sensor_readings for insert to authenticated with check ((select public.is_circux_staff()));

drop policy if exists audit_staff_read on public.audit_events;
create policy audit_staff_read on public.audit_events for select to authenticated using ((select public.is_circux_staff()));

insert into storage.buckets (id, name, public, file_size_limit)
values ('circux-project-files', 'circux-project-files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;
drop policy if exists circux_files_read on storage.objects;
create policy circux_files_read on storage.objects for select to anon, authenticated using (
  bucket_id = 'circux-project-files' and exists (
    select 1 from public.uploads u left join public.projects p on p.id = u.project_id
    where u.storage_path = name and ((u.project_id is null and (select public.is_circux_staff())) or (p.is_public and not p.is_archived))
  )
);
drop policy if exists circux_files_staff_insert on storage.objects;
create policy circux_files_staff_insert on storage.objects for insert to authenticated with check (bucket_id = 'circux-project-files' and (select public.is_circux_staff()));
drop policy if exists circux_files_staff_update on storage.objects;
create policy circux_files_staff_update on storage.objects for update to authenticated using (bucket_id = 'circux-project-files' and (select public.is_circux_staff())) with check (bucket_id = 'circux-project-files' and (select public.is_circux_staff()));
drop policy if exists circux_files_staff_delete on storage.objects;
create policy circux_files_staff_delete on storage.objects for delete to authenticated using (bucket_id = 'circux-project-files' and (select public.is_circux_staff()));
