alter table public.roleplay_coach_notes
    add column session_id uuid references public.sessions(id) on delete cascade;

alter table public.roleplay_coach_notes
    drop constraint roleplay_coach_notes_coach_mode_check;

alter table public.roleplay_coach_notes
    add constraint roleplay_coach_notes_coach_mode_check
    check (coach_mode in (
        'before_training',
        'after_training',
        'feedback',
        'notation',
        'persona_feedback'
    ));

alter table public.roleplay_coach_notes
    drop constraint roleplay_coach_notes_method_step_id_fkey;

alter table public.roleplay_coach_notes
    add constraint roleplay_coach_notes_method_step_id_fkey
    foreign key (method_step_id) references public.method_steps(id) on delete cascade;

alter table public.roleplay_coach_notes
    add constraint roleplay_coach_notes_context_check
    check (
        (method_step_id is not null and session_id is null)
        or (method_step_id is null and session_id is not null)
    );

drop index public.roleplay_coach_notes_context_uidx;

create unique index roleplay_coach_notes_step_context_uidx
    on public.roleplay_coach_notes (scenario_id, user_id, method_step_id, coach_mode)
    where method_step_id is not null and session_id is null;

create unique index roleplay_coach_notes_session_context_uidx
    on public.roleplay_coach_notes (scenario_id, user_id, session_id, coach_mode)
    where session_id is not null and method_step_id is null;

create index roleplay_coach_notes_session_idx
    on public.roleplay_coach_notes (session_id)
    where session_id is not null;

comment on table public.roleplay_coach_notes is
    'Notes saved by an authenticated user for either a roleplay method step or an evaluated roleplay session.';

comment on column public.roleplay_coach_notes.session_id is
    'Evaluated session associated with global coach, persona feedback, or debrief notes.';
