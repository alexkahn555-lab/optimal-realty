-- ============================================================================
-- OPTIMAL REALTY — LEAD PIPELINE SCHEMA
-- Build reference v2.0, Part 9.1. Source of truth. Applied MANUALLY.
-- ============================================================================
--
-- Supabase is the system of record. The browser never touches these tables —
-- one Next.js route handler owns all writes, using the service-role key.
-- Single-writer by construction. RLS is enabled with ZERO policies, so anon and
-- authenticated roles have no access at all.

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  locale            text not null check (locale in ('en','es')),
  portal            text check (portal in ('sellers','buyers','investors','landlords','tenants')),
  source_type       text not null check (source_type in
                      ('portal_cta','tool','listing','contact','booking')),
  source_slug       text,                    -- tool slug or listing slug
  route             text not null,           -- pathname at submission, includes locale
  intent            text not null check (intent in
                      ('sell','buy','invest','lease-out','rent','valuation','booking','general')),
  full_name         text not null check (char_length(full_name) between 2 and 120),
  email             text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone             text,                    -- E.164 or null
  message           text check (char_length(message) <= 4000),
  payload           jsonb,                   -- calculator inputs + outputs snapshot
  utm               jsonb,
  consent_sms       boolean not null default false,
  consent_marketing boolean not null default false,
  consent_ts        timestamptz,
  status            text not null default 'new' check (status in
                      ('new','notified','contacted','qualified','client','spam','archived')),
  crm_sync_status   text not null default 'pending' check (crm_sync_status in
                      ('pending','synced','failed','skipped')),
  crm_attempts      int not null default 0,
  crm_external_id   text,
  ip_hash           text,                    -- sha256(ip + LEAD_IP_SALT); raw IP never stored
  user_agent        text
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_open_idx    on public.leads (status) where status in ('new','notified');
create index if not exists leads_crm_idx     on public.leads (crm_sync_status) where crm_sync_status <> 'synced';
create index if not exists leads_email_idx   on public.leads (lower(email));

create table if not exists public.lead_events (
  id         bigint generated always as identity primary key,
  lead_id    uuid not null references public.leads(id) on delete cascade,
  created_at timestamptz not null default now(),
  type       text not null check (type in ('created','email_broker_sent','email_lead_sent',
               'sms_sent','sms_queued','crm_synced','crm_failed','status_changed','notify_error')),
  detail     jsonb
);

create index if not exists lead_events_lead_idx on public.lead_events (lead_id, created_at);

-- Fixed-window rate limiter. Counts EVERY attempt (including validation failures),
-- which is what an abuse limiter needs to see — unlike counting rows in `leads`,
-- which only counts submissions that already succeeded.
create table if not exists public.rate_limits (
  ip_hash      text not null,
  window_start timestamptz not null,
  hits         int not null default 1,
  primary key (ip_hash, window_start)
);

alter table public.leads       enable row level security;
alter table public.lead_events enable row level security;
alter table public.rate_limits enable row level security;
-- No policies. Service-role key only.

-- Rate-limit helper: count submissions from an ip_hash within a window.
create or replace function public.recent_lead_count(p_ip_hash text, p_window interval)
returns int language sql stable as $$
  select count(*)::int from public.leads
  where ip_hash = p_ip_hash and created_at > now() - p_window;
$$;
