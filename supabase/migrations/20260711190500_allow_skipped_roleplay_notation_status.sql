alter table public.sessions
    drop constraint if exists sessions_notation_status_check;

alter table public.sessions
    add constraint sessions_notation_status_check
    check (notation_status in ('not_started', 'processing', 'completed', 'failed', 'skipped')) not valid;

alter table public.sessions
    validate constraint sessions_notation_status_check;

comment on column public.sessions.notation_status is
    'Runtime status for notation generation: not_started, processing, completed, failed or skipped.';
