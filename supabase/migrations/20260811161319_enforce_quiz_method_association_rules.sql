-- method_id remains the single owner for method quizzes and an optional structural reference for contextual quizzes.
-- A method_knowledge quiz still requires one method and the existing partial
-- unique index keeps at most one active principal quiz per method.

update public.quiz_steps quiz_step
set method_step_id = null,
    updated_at = now()
from public.quizzes quiz
where quiz.id = quiz_step.quiz_id
  and quiz_step.method_step_id is not null
  and (
      quiz.method_id is null
      or not exists (
          select 1
          from public.method_steps method_step
          where method_step.id = quiz_step.method_step_id
            and method_step.method_id = quiz.method_id
      )
  );

comment on column public.quizzes.method_id is
    'Required owner for a method_knowledge quiz; optional structural reference for a contextual quiz.';

create or replace function private.normalize_quiz_method_detachment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    if old.method_id is not null
       and new.method_id is null
       and new.quiz_kind = 'method_knowledge' then
        new.quiz_kind = 'contextual';
    end if;

    return new;
end;
$$;

create or replace function private.reconcile_quiz_associations()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    update public.quiz_steps quiz_step
    set method_step_id = null,
        updated_at = now()
    where quiz_step.quiz_id = new.id
      and quiz_step.method_step_id is not null
      and (
          new.method_id is null
          or not exists (
              select 1
              from public.method_steps method_step
              where method_step.id = quiz_step.method_step_id
                and method_step.method_id = new.method_id
          )
      );

    return new;
end;
$$;

create or replace function private.enforce_quiz_step_method_link()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
    quiz_method_id uuid;
    step_method_id uuid;
begin
    if new.method_step_id is null then
        return new;
    end if;

    select quiz.method_id
    into quiz_method_id
    from public.quizzes quiz
    where quiz.id = new.quiz_id;

    select method_step.method_id
    into step_method_id
    from public.method_steps method_step
    where method_step.id = new.method_step_id;

    if quiz_method_id is null
       or step_method_id is distinct from quiz_method_id then
        raise exception using
            errcode = '23514',
            constraint = 'quiz_steps_method_step_matches_quiz_method',
            message = 'Une étape du quiz doit appartenir à la méthode associée au quiz.';
    end if;

    return new;
end;
$$;

drop trigger if exists normalize_quiz_method_detachment on public.quizzes;
create trigger normalize_quiz_method_detachment
before update of method_id on public.quizzes
for each row execute function private.normalize_quiz_method_detachment();

drop trigger if exists reconcile_quiz_associations on public.quizzes;
create trigger reconcile_quiz_associations
after insert or update of quiz_kind, method_id on public.quizzes
for each row execute function private.reconcile_quiz_associations();

drop trigger if exists enforce_quiz_step_method_link on public.quiz_steps;
create trigger enforce_quiz_step_method_link
before insert or update of quiz_id, method_step_id on public.quiz_steps
for each row execute function private.enforce_quiz_step_method_link();

revoke all on function private.reconcile_quiz_associations()
from public, anon, authenticated;
revoke all on function private.normalize_quiz_method_detachment()
from public, anon, authenticated;
revoke all on function private.enforce_quiz_step_method_link()
from public, anon, authenticated;
