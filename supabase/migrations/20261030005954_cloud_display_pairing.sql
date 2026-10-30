create or replace function public.set_display_slot(p_token_hash text, p_slot text, p_project_id text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if length(coalesce(p_token_hash,'')) <> 64 or p_token_hash !~ '^[a-f0-9]{64}$' or p_slot not in ('A','B') then return false; end if;
  if p_project_id is not null and not exists (
    select 1 from public.projects p where p.id=p_project_id and p.is_public and not p.is_archived
  ) then return false; end if;
  update public.exhibition_pairings e
    set slots=jsonb_set(e.slots,array[p_slot],coalesce(to_jsonb(p_project_id),'null'::jsonb),true), updated_at=now()
    where e.token_hash=p_token_hash and e.expires_at>now();
  return found;
end;
$$;
revoke all on function public.set_display_slot(text,text,text) from public;
grant execute on function public.set_display_slot(text,text,text) to anon, authenticated;

create or replace function public.swap_display_slots(p_token_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if length(coalesce(p_token_hash,'')) <> 64 or p_token_hash !~ '^[a-f0-9]{64}$' then return false; end if;
  update public.exhibition_pairings e
    set slots=jsonb_build_object('A',e.slots->'B','B',e.slots->'A'), updated_at=now()
    where e.token_hash=p_token_hash and e.expires_at>now();
  return found;
end;
$$;
revoke all on function public.swap_display_slots(text) from public;
grant execute on function public.swap_display_slots(text) to anon, authenticated;
