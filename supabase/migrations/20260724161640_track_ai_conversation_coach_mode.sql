alter table public.ai_conversation_sessions
    add column if not exists coach_mode text;

alter table public.ai_conversation_sessions
    drop constraint if exists ai_conversation_sessions_coach_mode_check;

alter table public.ai_conversation_sessions
    add constraint ai_conversation_sessions_coach_mode_check
    check (
        coach_mode is null
        or (
            interaction_type = 'coach'
            and coach_mode in (
                'before_training',
                'after_training',
                'feedback',
                'notation'
            )
        )
    ) not valid;

alter table public.ai_conversation_sessions
    validate constraint ai_conversation_sessions_coach_mode_check;

comment on column public.ai_conversation_sessions.coach_mode is
    'Roleplay coach mode used by this tracked conversation. Null is reserved for Ask Persona, legacy Coach rows and generic Coach sessions.';
