alter table public.roleplay_coach_sessions rename to roleplay_coach_notes;

alter table public.roleplay_coach_notes drop column transcript;

alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_pkey to roleplay_coach_notes_pkey;
alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_scenario_id_fkey to roleplay_coach_notes_scenario_id_fkey;
alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_user_id_fkey to roleplay_coach_notes_user_id_fkey;
alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_method_step_id_fkey to roleplay_coach_notes_method_step_id_fkey;
alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_step_order_check to roleplay_coach_notes_step_order_check;
alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_coach_mode_check to roleplay_coach_notes_coach_mode_check;
alter table public.roleplay_coach_notes
    rename constraint roleplay_coach_sessions_notes_check to roleplay_coach_notes_notes_check;

alter index public.roleplay_coach_sessions_scenario_user_idx
    rename to roleplay_coach_notes_scenario_user_idx;
alter index public.roleplay_coach_sessions_user_created_idx
    rename to roleplay_coach_notes_user_created_idx;
alter index public.roleplay_coach_sessions_method_step_idx
    rename to roleplay_coach_notes_method_step_idx;
alter index public.roleplay_coach_sessions_notes_context_uidx
    rename to roleplay_coach_notes_context_uidx;

comment on table public.roleplay_coach_notes is
    'Notes saved by an authenticated user for a roleplay method step and coach mode.';
