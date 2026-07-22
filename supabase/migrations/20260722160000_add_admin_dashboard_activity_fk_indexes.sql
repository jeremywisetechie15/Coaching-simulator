-- Cover foreign-key maintenance paths independently from period-oriented
-- dashboard indexes, whose leading columns are timestamps.
create index quiz_attempts_organization_id_idx
    on public.quiz_attempts (organization_id);
create index quiz_attempts_user_id_idx
    on public.quiz_attempts (user_id);
create index ai_conversation_sessions_organization_id_idx
    on public.ai_conversation_sessions (organization_id);
create index user_login_events_organization_id_idx
    on public.user_login_events (organization_id);
