create or replace function public.get_display_state(p_token_hash text)
returns table (pairing_id uuid, slots jsonb, expires_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.slots, p.expires_at from public.exhibition_pairings p
  where length(p_token_hash) = 64 and p.token_hash = p_token_hash and p.expires_at > now()
  limit 1;
$$;
revoke all on function public.get_display_state(text) from public;
grant execute on function public.get_display_state(text) to anon, authenticated;

