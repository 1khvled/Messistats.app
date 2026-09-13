-- =============================================================================
-- MessiStats (messistat.com) Dedicated Analytics Schema
-- Compatible with Supabase Project: (supabase-ref-removed)
-- Safe & Idempotent: DOES NOT modify or delete any tables from other projects!
-- =============================================================================

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

-- 4. Create RLS policies for anonymous public tracking and admin reading
-- Allow anyone (public visitor) to insert tracking events
drop policy if exists "messi_allow_insert" on public.messi_page_events;
create policy "messi_allow_insert" on public.messi_page_events
  for insert to anon, authenticated, service_role
  with check (true);

-- Allow reading events for analytics dashboard
drop policy if exists "messi_allow_select" on public.messi_page_events;
create policy "messi_allow_select" on public.messi_page_events
  for select to anon, authenticated, service_role
  using (true);

-- 5. Grant required table and sequence permissions
grant select, insert on public.messi_page_events to anon, authenticated, service_role;
grant usage, select on sequence public.messi_page_events_id_seq to anon, authenticated, service_role;

-- 6. Helper function for database maintenance (clean events older than X days)
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

grant execute on function public.messi_clear_old_events(integer) to anon, authenticated, service_role;
