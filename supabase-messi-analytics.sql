-- =============================================================================
-- MessiStats (messistat.com) Analytics Schema — Hardened & Secure Baseline
-- Safe & Idempotent: DOES NOT modify or delete any tables from other projects!
-- =============================================================================

-- 0. Rate-limit table for /api/admin-auth (persistent across Vercel isolates).
--    NEVER readable/writable by anon: only service_role touches it.
create table if not exists public.messi_admin_rate_limits (
  ip_hash text primary key,
  count integer not null default 0,
  first_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  locked_until timestamptz,
  lockouts integer not null default 0
);
alter table public.messi_admin_rate_limits enable row level security;
revoke all on public.messi_admin_rate_limits from anon, authenticated;
grant all on public.messi_admin_rate_limits to service_role;

-- 1. Create table for tracking pageviews, birthday searches, video plays, and pings
create table if not exists public.messi_page_events (
  id bigserial primary key,
  client_id text not null,
  session_id text,
  event text not null default 'view',
  path text not null,
  referrer text,
  user_agent text,
  country_code text,
  device_type text default 'desktop',
  meta jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 2. Create high-performance indexes for lightning-fast KPI aggregations
create index if not exists messi_events_created_at_idx on public.messi_page_events (created_at desc);
create index if not exists messi_events_event_idx on public.messi_page_events (event);
create index if not exists messi_events_path_idx on public.messi_page_events (path);
create index if not exists messi_events_client_id_idx on public.messi_page_events (client_id);
create index if not exists messi_events_device_idx on public.messi_page_events (device_type);

-- 3. Enable Row Level Security (RLS)
alter table public.messi_page_events enable row level security;

-- 4. Lock READS: no anon access. Admin dashboard reads via api/admin-events.js (SERVICE_ROLE).
drop policy if exists "messi_allow_select" on public.messi_page_events;
drop policy if exists "messi_admin_select" on public.messi_page_events;
create policy "messi_admin_select" on public.messi_page_events
  for select to authenticated, service_role
  using (true);
revoke select on public.messi_page_events from anon;
grant select on public.messi_page_events to authenticated, service_role;

-- 5. Strict validated INSERT for telemetry
drop policy if exists "messi_allow_insert" on public.messi_page_events;
drop policy if exists "messi_validated_insert" on public.messi_page_events;
create policy "messi_validated_insert" on public.messi_page_events
  for insert to anon, authenticated, service_role
  with check (
    event in ('view', 'ping', 'birthday_search', 'video_play', 'share')
    and char_length(client_id) between 1 and 80
    and (session_id is null or char_length(session_id) <= 80)
    and char_length(path) between 1 and 200
    and (referrer is null or char_length(referrer) <= 200)
    and (user_agent is null or char_length(user_agent) <= 300)
    and (country_code is null or char_length(country_code) <= 8)
    and (device_type is null or char_length(device_type) <= 16)
    and (meta is null or octet_length(meta::text) <= 4000)
  );

revoke insert, update, delete on public.messi_page_events from anon, authenticated;
grant insert on public.messi_page_events to anon, authenticated, service_role;
grant usage, select on sequence public.messi_page_events_id_seq to anon, authenticated, service_role;
grant all on public.messi_page_events to service_role;

-- 6. Helper function for database maintenance (clean events older than X days) — SERVICE_ROLE ONLY
create or replace function public.messi_clear_old_events(days integer)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from public.messi_page_events
  where created_at < now() - make_interval(days => days);
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke execute on function public.messi_clear_old_events(integer) from anon, authenticated;
grant execute on function public.messi_clear_old_events(integer) to service_role;
