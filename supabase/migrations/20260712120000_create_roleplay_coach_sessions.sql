create table public.roleplay_coach_sessions (
    id uuid primary key,
    scenario_id uuid not null references public.scenarios(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    method_step_id uuid references public.method_steps(id) on delete set null,
    step_order integer not null check (step_order > 0),
    coach_mode text not null check (coach_mode in ('before_training', 'after_training')),
    transcript jsonb not null default '[]'::jsonb check (jsonb_typeof(transcript) = 'array'),
    notes jsonb not null default '[]'::jsonb check (jsonb_typeof(notes) = 'array'),
    created_at timestamptz not null default now(),
    saved_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index roleplay_coach_sessions_scenario_user_idx
    on public.roleplay_coach_sessions (scenario_id, user_id);

create index roleplay_coach_sessions_user_created_idx
    on public.roleplay_coach_sessions (user_id, created_at desc);

alter table public.roleplay_coach_sessions enable row level security;

revoke all on public.roleplay_coach_sessions from anon, authenticated, public;

comment on table public.roleplay_coach_sessions is
    'Authenticated roleplay preparation transcripts and meeting notes. Access is mediated by server controllers.';
