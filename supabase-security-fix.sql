-- =============================================================================
-- MessiStats SECURITY FIX — run in Supabase SQL editor
-- Date: 2026-09-14. Idempotent — safe to run twice.
--
-- What was wrong (pentest 2026-09-14, verified live):
--   1. anon could SELECT the whole analytics table (any visitor dumped all
--      visitor ids / user agents / paths with the public anon key).
--   2. anon + authenticated could EXECUTE messi_clear_old_events(days) —
--      anyone could wipe the table with days=0.
--   3. INSERT had no validation — anyone could store multi-MB / XSS payloads.
--   4. Admin rate limiting lived in serverless memory only (reset on refresh).
-- After this fix: anon is INSERT-only (validated), reads go through the
-- server proxy api/admin-events.js (SERVICE_ROLE), deletes are service-only,
-- and rate limits persist in messi_admin_rate_limits.
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
-- No anon/authenticated policies = denied for them. Service role bypasses RLS.
revoke all on public.messi_admin_rate_limits from anon, authenticated;

-- 1. Lock READS: drop the world-readable policy, allow service + logged-in only.
--    (Admin dashboard now reads via api/admin-events.js with SERVICE_ROLE.)
drop policy if exists "messi_allow_select" on public.messi_page_events;
drop policy if exists "messi_admin_select" on public.messi_page_events;
create policy "messi_admin_select" on public.messi_page_events
  for select to authenticated, service_role
  using (true);
revoke select on public.messi_page_events from anon;
grant select on public.messi_page_events to authenticated, service_role;

-- 2. Harden INSERT: keep public tracking working, but validate shape/size.
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
revoke insert on public.messi_page_events from anon, authenticated, service_role;
grant insert on public.messi_page_events to anon, authenticated, service_role;
grant usage, select on sequence public.messi_page_events_id_seq to anon, authenticated, service_role;

-- 3. Deletes/maintenance: service_role ONLY. This closes the anon wipe hole.
revoke execute on function public.messi_clear_old_events(integer) from anon, authenticated;
grant execute on function public.messi_clear_old_events(integer) to service_role;

-- 4. No UPDATE/DELETE for anyone except service_role (RLS has no such policies,
--    so they are denied for anon/authenticated by default). Belt and suspenders:
revoke update, delete on public.messi_page_events from anon, authenticated;
grant all on public.messi_page_events to service_role;
grant all on public.messi_admin_rate_limits to service_role;

-- Verify with (expect: 0 rows for anon SELECT after fix):
--   select * from public.messi_page_events limit 1;
