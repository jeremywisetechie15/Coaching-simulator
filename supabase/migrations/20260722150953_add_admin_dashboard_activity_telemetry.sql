-- Minimal, server-owned activity telemetry for the ADMIN dashboard.
-- Historical rows deliberately keep nullable measured durations: unknown data must
-- never be presented as zero activity.

alter table public.sessions
    add column ended_at timestamptz,
    add column technical_error boolean not null default false;

comment on column public.sessions.ended_at is
    'Actual roleplay completion timestamp used by period-based analytics.';
comment on column public.sessions.technical_error is
    'True when a technical failure makes the roleplay session ineligible for usage metrics.';

create index sessions_ended_organization_metrics_idx
    on public.sessions (ended_at, organization_id)
    where status = 'completed'
      and technical_error = false
      and duration_seconds >= 30;

alter table public.quiz_attempts
    add column organization_id uuid references public.organizations(id) on delete set null,
    add column active_duration_seconds integer,
    add column last_activity_at timestamptz,
    add constraint quiz_attempts_active_duration_seconds_check
        check (active_duration_seconds is null or active_duration_seconds >= 0);

comment on column public.quiz_attempts.organization_id is
    'Organization snapshot captured when the quiz attempt starts.';
comment on column public.quiz_attempts.active_duration_seconds is
    'Measured active time. NULL means that duration was not measured for this historical attempt.';
comment on column public.quiz_attempts.last_activity_at is
    'Server timestamp of the latest accepted active-duration heartbeat.';

create index quiz_attempts_completed_organization_idx
    on public.quiz_attempts (completed_at, organization_id)
    where status = 'completed';

-- Session facts are written by authenticated server controllers. Direct public
-- writes would allow forged analytics and transcripts.
alter table public.sessions enable row level security;
revoke all on table public.sessions from public, anon, authenticated;
grant select on table public.sessions to authenticated;
grant select, insert, update, delete on table public.sessions to service_role;

drop policy if exists "Public can insert sessions" on public.sessions;
drop policy if exists "Public can read sessions" on public.sessions;
drop policy if exists "Authenticated users can read allowed sessions" on public.sessions;
create policy "Authenticated users can read allowed sessions"
    on public.sessions
    for select
    to authenticated
    using (user_id = (select auth.uid()) or private.is_platform_admin());

alter table public.messages enable row level security;
revoke all on table public.messages from public, anon, authenticated;
grant select on table public.messages to authenticated;
grant select, insert, update, delete on table public.messages to service_role;

drop policy if exists "Public can insert messages" on public.messages;
drop policy if exists "Public can read messages" on public.messages;
drop policy if exists "Authenticated users can read allowed session messages" on public.messages;
create policy "Authenticated users can read allowed session messages"
    on public.messages
    for select
    to authenticated
    using (
        exists (
            select 1
            from public.sessions
            where sessions.id = messages.session_id
              and (
                  sessions.user_id = (select auth.uid())
                  or private.is_platform_admin()
              )
        )
    );

create table public.ai_conversation_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete set null,
    interaction_type text not null
        check (interaction_type in ('ask_persona', 'coach')),
    status text not null default 'active'
        check (status in ('active', 'completed', 'abandoned', 'error', 'timed_out')),
    started_at timestamptz not null default now(),
    ended_at timestamptz,
    last_activity_at timestamptz not null default now(),
    active_duration_seconds integer not null default 0
        check (active_duration_seconds >= 0),
    user_message_count integer not null default 0
        check (user_message_count >= 0),
    ai_message_count integer not null default 0
        check (ai_message_count >= 0),
    technical_error boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint ai_conversation_sessions_end_consistency_check check (
        (status = 'active' and ended_at is null)
        or (status <> 'active' and ended_at is not null)
    )
);

comment on table public.ai_conversation_sessions is
    'Server-owned usage facts for Ask Persona and Coach AI conversations. Roleplay simulations remain in sessions.';

create index ai_conversation_sessions_ended_organization_idx
    on public.ai_conversation_sessions (ended_at, organization_id, interaction_type)
    where status = 'completed' and technical_error = false;
create index ai_conversation_sessions_user_started_idx
    on public.ai_conversation_sessions (user_id, started_at desc);

drop trigger if exists ai_conversation_sessions_set_updated_at
    on public.ai_conversation_sessions;
create trigger ai_conversation_sessions_set_updated_at
before update on public.ai_conversation_sessions
for each row execute function public.set_updated_at();

alter table public.ai_conversation_sessions enable row level security;
revoke all on table public.ai_conversation_sessions from public, anon, authenticated;
grant select, insert, update, delete on table public.ai_conversation_sessions to service_role;

create table public.user_login_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    organization_id uuid references public.organizations(id) on delete set null,
    occurred_at timestamptz not null default now(),
    source text not null default 'web'
        check (source in ('web', 'mobile_web')),
    created_at timestamptz not null default now()
);

comment on table public.user_login_events is
    'Successful learner authentication events used by the ADMIN activity chart.';

create index user_login_events_occurred_organization_idx
    on public.user_login_events (occurred_at, organization_id);
create index user_login_events_user_occurred_idx
    on public.user_login_events (user_id, occurred_at desc);

alter table public.user_login_events enable row level security;
revoke all on table public.user_login_events from public, anon, authenticated;
grant select, insert, delete on table public.user_login_events to service_role;
