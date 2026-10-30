create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('admin', 'instructor', 'judge', 'viewer')),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create or replace function public.create_circux_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_circux on auth.users;
create trigger on_auth_user_created_circux after insert on auth.users
for each row execute function public.create_circux_profile();

create or replace function public.is_circux_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'instructor')
  );
$$;

create or replace function public.is_circux_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin');
$$;

create or replace function public.is_circux_judge()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'judge');
$$;

revoke all on function public.is_circux_staff() from public, anon;
revoke all on function public.is_circux_admin() from public, anon;
revoke all on function public.is_circux_judge() from public, anon;
grant execute on function public.is_circux_staff() to authenticated;
grant execute on function public.is_circux_admin() to authenticated;
grant execute on function public.is_circux_judge() to authenticated;

create table if not exists public.projects (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,80}$'),
  name text not null check (length(trim(name)) between 1 and 200),
  data jsonb not null default '{}'::jsonb,
  is_public boolean not null default true,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_public_updated_idx on public.projects (updated_at desc) where is_public and not is_archived;
create index if not exists projects_data_gin_idx on public.projects using gin (data);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  role text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists project_members_project_idx on public.project_members(project_id);

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  section_key text not null check (length(section_key) between 1 and 80),
  title text not null check (length(title) between 1 and 160),
  content text not null default '',
  is_published boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (project_id, section_key)
);
create index if not exists project_documents_project_idx on public.project_documents(project_id);

create table if not exists public.judging_records (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete restrict,
  judge_id uuid not null references auth.users(id) on delete restrict,
  scores jsonb not null check (jsonb_typeof(scores) = 'array'),
  feedback text not null default '' check (length(feedback) <= 10000),
  created_at timestamptz not null default now()
);
create index if not exists judging_project_created_idx on public.judging_records(project_id, created_at desc);
create index if not exists judging_judge_created_idx on public.judging_records(judge_id, created_at desc);

create table if not exists public.workspace_settings (
  id text primary key default 'event' check (id = 'event'),
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.exhibition_pairings (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'Exhibition display' check (length(display_name) <= 120),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  slots jsonb not null default '{"A":null,"B":null}'::jsonb check (jsonb_typeof(slots) = 'object'),
  expires_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
create index if not exists exhibition_pairings_expiry_idx on public.exhibition_pairings(expires_at);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.projects(id) on delete set null,
  storage_path text not null unique,
  file_name text not null check (length(file_name) between 1 and 200),
  content_type text not null,
  byte_size bigint not null check (byte_size between 0 and 10485760),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists uploads_project_created_idx on public.uploads(project_id, created_at desc);

create table if not exists public.hardware_boards (
  id text primary key check (id ~ '^[A-Za-z0-9_-]{1,80}$'),
  project_id text references public.projects(id) on delete set null,
  name text not null check (length(name) between 1 and 120),
  device_token_hash text not null,
  configuration jsonb not null default '{}'::jsonb,
  last_seen timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.sensor_readings (
  id bigint generated always as identity primary key,
  board_id text not null references public.hardware_boards(id) on delete cascade,
  project_id text references public.projects(id) on delete set null,
  readings jsonb not null check (jsonb_typeof(readings) = 'array'),
  source text not null check (source in ('arduino_serial', 'rfid')),
  recorded_at timestamptz not null,
  received_at timestamptz not null default now()
);
create index if not exists sensor_readings_project_time_idx on public.sensor_readings(project_id, recorded_at desc);
create index if not exists sensor_readings_board_time_idx on public.sensor_readings(board_id, recorded_at desc);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_created_idx on public.audit_events(created_at desc);

