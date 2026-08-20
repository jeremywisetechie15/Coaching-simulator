-- A contextual quiz is structurally independent from methods. A method quiz
-- may stay unattached while it is a draft, but publication requires a method.
-- Existing quiz content, attempts and roleplay associations are preserved.

set lock_timeout = '10s';

-- A method quiz draft is now allowed to remain unattached. Detaching a method
-- must therefore be an explicit aggregate change instead of silently changing
-- quiz_kind in a BEFORE trigger.
drop trigger if exists normalize_quiz_method_detachment on public.quizzes;
drop function if exists private.normalize_quiz_method_detachment();

-- Clear only method-step mappings and method ownership from legacy contextual
-- quizzes. Groups, questions, choices, skills, attachments and history remain.
update public.quiz_steps quiz_step
set method_step_id = null,
    updated_at = now()
from public.quizzes quiz
where quiz.id = quiz_step.quiz_id
  and quiz.quiz_kind = 'contextual'
  and quiz_step.method_step_id is not null;

update public.quizzes
set method_id = null,
    updated_at = now()
where quiz_kind = 'contextual'
  and method_id is not null;

alter table public.quizzes
drop constraint if exists quizzes_method_required_for_method_knowledge_check;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'quizzes_method_matches_kind_and_status_check'
          and conrelid = 'public.quizzes'::regclass
    ) then
        alter table public.quizzes
        add constraint quizzes_method_matches_kind_and_status_check
        check (
            (quiz_kind = 'contextual' and method_id is null)
            or (
                quiz_kind = 'method_knowledge'
                and (
                    status <> 'published'::public.content_status
                    or method_id is not null
                )
            )
        ) not valid;
    end if;
end;
$$;

alter table public.quizzes
validate constraint quizzes_method_matches_kind_and_status_check;

comment on column public.quizzes.method_id is
    'Forbidden for contextual quizzes; optional for method_knowledge drafts and required when method_knowledge is published.';

-- Complementary roleplay quizzes are contextual by definition. Their
-- compatibility no longer depends on a method because contextual quizzes
-- cannot own one.
create or replace function private.enforce_scenario_quiz_method_compatibility()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    selected_quiz_kind text;
begin
    select quiz.quiz_kind
    into selected_quiz_kind
    from public.quizzes quiz
    where quiz.id = new.quiz_id
    for key share;

    if selected_quiz_kind = 'method_knowledge' then
        perform private.raise_content_lifecycle_conflict(
            'Un quiz principal de méthode ne peut pas être ajouté comme quiz complémentaire d’un roleplay.'
        );
    end if;

    return new;
end;
$$;

create or replace function private.enforce_quiz_roleplay_method_compatibility()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    if new.quiz_kind = 'method_knowledge'
       and exists (
           select 1
           from public.scenario_quizzes scenario_quiz
           where scenario_quiz.quiz_id = new.id
       ) then
        perform private.raise_content_lifecycle_conflict(
            'Ce quiz est encore utilisé comme quiz complémentaire dans un ou plusieurs roleplays. Retirez-le d’abord de ces roleplays avant de le définir comme quiz principal.'
        );
    end if;

    return new;
end;
$$;

revoke all on function private.enforce_scenario_quiz_method_compatibility()
from public, anon, authenticated;

revoke all on function private.enforce_quiz_roleplay_method_compatibility()
from public, anon, authenticated;

grant execute on function private.enforce_scenario_quiz_method_compatibility()
to service_role;

grant execute on function private.enforce_quiz_roleplay_method_compatibility()
to service_role;
