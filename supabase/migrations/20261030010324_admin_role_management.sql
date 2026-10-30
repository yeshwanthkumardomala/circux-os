alter table public.profiles add column if not exists email text not null default '';

create or replace function public.create_circux_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, coalesce(new.email,''), coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do update set email=excluded.email;
  return new;
end;
$$;
revoke all on function public.create_circux_profile() from public, anon, authenticated;

create or replace function public.admin_set_circux_role(p_user_id uuid, p_role text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_circux_admin() then raise exception 'Administrator role required' using errcode='42501'; end if;
  if p_role not in ('admin','instructor','judge','viewer') then raise exception 'Invalid role'; end if;
  if p_user_id = auth.uid() then raise exception 'Use an administrator account to change your own role'; end if;
  update public.profiles set role=p_role where id=p_user_id;
  return found;
end;
$$;
revoke all on function public.admin_set_circux_role(uuid,text) from public, anon;
grant execute on function public.admin_set_circux_role(uuid,text) to authenticated;

drop trigger if exists circux_audit_profiles on public.profiles;
create trigger circux_audit_profiles after update of role on public.profiles
for each row when (old.role is distinct from new.role)
execute function private.record_circux_audit();
