-- A used quiz keeps its content structure immutable, while administrators may
-- correct its optional method-step mappings. Historical attempts reference the
-- stable quiz/step/question ids and remain untouched.

create or replace function private.quiz_structure_matches(
    p_quiz_id uuid,
    p_steps jsonb,
    p_competencies jsonb,
    p_questions jsonb,
    p_choices jsonb,
    p_attachments jsonb
)
returns boolean
language sql
stable
set search_path = ''
as $$
with
incoming_steps as (
    select id, quiz_id, step_order
    from jsonb_populate_recordset(null::public.quiz_steps, coalesce(p_steps, '[]'::jsonb))
),
incoming_competencies as (
    select step_id, competence_id
    from jsonb_populate_recordset(null::public.quiz_step_competencies, coalesce(p_competencies, '[]'::jsonb))
),
incoming_questions as (
    select id, step_id, question_order, question_type, competence_id,
        dimension, dimension_item, dimension_item_id
    from jsonb_populate_recordset(null::public.quiz_questions, coalesce(p_questions, '[]'::jsonb))
),
incoming_choices as (
    select id, question_id, choice_order, is_correct
    from jsonb_populate_recordset(null::public.quiz_question_choices, coalesce(p_choices, '[]'::jsonb))
),
incoming_attachments as (
    select id, question_id, attachment_order, attachment_type,
        storage_bucket, storage_path
    from jsonb_populate_recordset(null::public.quiz_question_attachments, coalesce(p_attachments, '[]'::jsonb))
)
select
    not exists (
        (select id, quiz_id, step_order
         from public.quiz_steps where quiz_id = p_quiz_id
         except
         select id, quiz_id, step_order from incoming_steps)
        union all
        (select id, quiz_id, step_order from incoming_steps
         except
         select id, quiz_id, step_order
         from public.quiz_steps where quiz_id = p_quiz_id)
    )
    and not exists (
        (select qsc.step_id, qsc.competence_id
         from public.quiz_step_competencies qsc
         join public.quiz_steps qs on qs.id = qsc.step_id
         where qs.quiz_id = p_quiz_id
         except
         select step_id, competence_id from incoming_competencies)
        union all
        (select step_id, competence_id from incoming_competencies
         except
         select qsc.step_id, qsc.competence_id
         from public.quiz_step_competencies qsc
         join public.quiz_steps qs on qs.id = qsc.step_id
         where qs.quiz_id = p_quiz_id)
    )
    and not exists (
        (select qq.id, qq.step_id, qq.question_order, qq.question_type,
            qq.competence_id, qq.dimension, qq.dimension_item, qq.dimension_item_id
         from public.quiz_questions qq
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id
         except
         select id, step_id, question_order, question_type,
            competence_id, dimension, dimension_item, dimension_item_id
         from incoming_questions)
        union all
        (select id, step_id, question_order, question_type,
            competence_id, dimension, dimension_item, dimension_item_id
         from incoming_questions
         except
         select qq.id, qq.step_id, qq.question_order, qq.question_type,
            qq.competence_id, qq.dimension, qq.dimension_item, qq.dimension_item_id
         from public.quiz_questions qq
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id)
    )
    and not exists (
        (select qc.id, qc.question_id, qc.choice_order, qc.is_correct
         from public.quiz_question_choices qc
         join public.quiz_questions qq on qq.id = qc.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id
         except
         select id, question_id, choice_order, is_correct from incoming_choices)
        union all
        (select id, question_id, choice_order, is_correct from incoming_choices
         except
         select qc.id, qc.question_id, qc.choice_order, qc.is_correct
         from public.quiz_question_choices qc
         join public.quiz_questions qq on qq.id = qc.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id)
    )
    and not exists (
        (select qa.id, qa.question_id, qa.attachment_order, qa.attachment_type,
            qa.storage_bucket, qa.storage_path
         from public.quiz_question_attachments qa
         join public.quiz_questions qq on qq.id = qa.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id
         except
         select id, question_id, attachment_order, attachment_type,
            storage_bucket, storage_path
         from incoming_attachments)
        union all
        (select id, question_id, attachment_order, attachment_type,
            storage_bucket, storage_path
         from incoming_attachments
         except
         select qa.id, qa.question_id, qa.attachment_order, qa.attachment_type,
            qa.storage_bucket, qa.storage_path
         from public.quiz_question_attachments qa
         join public.quiz_questions qq on qq.id = qa.question_id
         join public.quiz_steps qs on qs.id = qq.step_id
         where qs.quiz_id = p_quiz_id)
    );
$$;

-- Complementary roleplay quizzes and principal method quizzes are mutually
-- exclusive. A contextual quiz with a reference method may only be attached
-- to roleplays using that same method.
create or replace function private.enforce_scenario_quiz_method_compatibility()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    scenario_method_id uuid;
    quiz_kind text;
    quiz_method_id uuid;
begin
    select scenario.method_id
    into scenario_method_id
    from public.scenarios scenario
    where scenario.id = new.scenario_id
    for key share;

    select quiz.quiz_kind, quiz.method_id
    into quiz_kind, quiz_method_id
    from public.quizzes quiz
    where quiz.id = new.quiz_id
    for key share;

    if quiz_kind = 'method_knowledge' then
        perform private.raise_content_lifecycle_conflict(
            'Un quiz principal de méthode ne peut pas être ajouté comme quiz complémentaire d’un roleplay.'
        );
    end if;

    if quiz_method_id is not null
       and quiz_method_id is distinct from scenario_method_id then
        perform private.raise_content_lifecycle_conflict(
            'Le quiz complémentaire est rattaché à une autre méthode que celle du roleplay.'
        );
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_scenario_quiz_method_compatibility
on public.scenario_quizzes;

create trigger enforce_scenario_quiz_method_compatibility
before insert or update on public.scenario_quizzes
for each row execute function private.enforce_scenario_quiz_method_compatibility();

create or replace function private.enforce_quiz_roleplay_method_compatibility()
returns trigger
language plpgsql
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

    if new.quiz_kind = 'contextual'
       and new.method_id is not null
       and exists (
           select 1
           from public.scenario_quizzes scenario_quiz
           join public.scenarios scenario
             on scenario.id = scenario_quiz.scenario_id
           where scenario_quiz.quiz_id = new.id
             and scenario.method_id is distinct from new.method_id
       ) then
        perform private.raise_content_lifecycle_conflict(
            'Ce quiz est utilisé par un roleplay rattaché à une autre méthode.'
        );
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_quiz_roleplay_method_compatibility
on public.quizzes;

create trigger enforce_quiz_roleplay_method_compatibility
before update of quiz_kind, method_id on public.quizzes
for each row execute function private.enforce_quiz_roleplay_method_compatibility();

-- Method creation uses this narrow aggregate so demotion/promotion stays
-- atomic and locks the selected quiz before the compatibility trigger runs.
create or replace function public.admin_sync_method_quiz_association(
    p_method_id uuid,
    p_quiz_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    quiz_row public.quizzes%rowtype;
begin
    perform 1
    from public.methods
    where id = p_method_id
    for update;
    if not found then raise no_data_found; end if;

    if p_quiz_id is not null then
        select *
        into quiz_row
        from public.quizzes
        where id = p_quiz_id
        for update;

        if not found then
            perform private.raise_content_lifecycle_conflict('Le quiz associé est introuvable.');
        end if;

        if quiz_row.method_id is not null
           and quiz_row.method_id <> p_method_id then
            perform private.raise_content_lifecycle_conflict(
                'Ce quiz est déjà associé à une autre méthode.'
            );
        end if;
    end if;

    update public.quizzes
    set method_id = null,
        quiz_kind = 'contextual'
    where method_id = p_method_id
      and quiz_kind = 'method_knowledge'
      and (p_quiz_id is null or id <> p_quiz_id);

    if p_quiz_id is not null then
        update public.quizzes
        set method_id = p_method_id,
            quiz_kind = 'method_knowledge'
        where id = p_quiz_id;
    end if;
end;
$$;

-- The aggregate update stays atomic. For a used quiz, only the fields that
-- were already editable are written after the structural comparison succeeds:
-- method-step mappings, step copy/weight, question copy/points, answer labels,
-- and attachment labels/URLs. Structural fields and historical attempts stay
-- untouched.
create or replace function public.admin_update_quiz_aggregate(
    p_quiz_id uuid,
    p_quiz jsonb,
    p_steps jsonb,
    p_competencies jsonb,
    p_questions jsonb,
    p_choices jsonb,
    p_attachments jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
    payload public.quizzes%rowtype;
    has_attempts boolean;
begin
    perform 1 from public.quizzes where id = p_quiz_id for update;
    if not found then raise no_data_found; end if;
    select * into payload from jsonb_populate_record(null::public.quizzes, p_quiz);

    select exists(
        select 1 from public.quiz_attempts where quiz_id = p_quiz_id
    ) into has_attempts;

    if has_attempts and not private.quiz_structure_matches(
        p_quiz_id,
        p_steps,
        p_competencies,
        p_questions,
        p_choices,
        p_attachments
    ) then
        perform private.raise_content_lifecycle_conflict(
            'Ce quiz contient des tentatives. Dupliquez-le pour modifier ses étapes ou ses questions.'
        );
    end if;

    update public.quizzes set
        title = payload.title,
        description = payload.description,
        quiz_kind = payload.quiz_kind,
        quiz_type = payload.quiz_type,
        difficulty_level = payload.difficulty_level,
        domain = payload.domain,
        categories = payload.categories,
        method_id = payload.method_id,
        duration_minutes = payload.duration_minutes,
        validation_threshold = payload.validation_threshold,
        max_attempts = payload.max_attempts,
        tags = payload.tags,
        visibility_scope = payload.visibility_scope,
        organization_id = payload.organization_id,
        group_id = payload.group_id,
        assigned_user_id = payload.assigned_user_id,
        participation = payload.participation,
        status = payload.status,
        is_active = payload.is_active,
        updated_at = payload.updated_at
    where id = p_quiz_id;

    if not has_attempts then
        delete from public.quiz_steps where quiz_id = p_quiz_id;
        insert into public.quiz_steps (id, quiz_id, method_step_id, step_order, name, weight)
        select id, quiz_id, method_step_id, step_order, name, weight
        from jsonb_populate_recordset(null::public.quiz_steps, coalesce(p_steps, '[]'::jsonb));
        insert into public.quiz_step_competencies (step_id, competence_id)
        select step_id, competence_id
        from jsonb_populate_recordset(null::public.quiz_step_competencies, coalesce(p_competencies, '[]'::jsonb));
        insert into public.quiz_questions (
            id, step_id, question_order, question_type, prompt, competence_id,
            dimension, dimension_item, dimension_item_id, points, explanation
        )
        select id, step_id, question_order, question_type, prompt, competence_id,
            dimension, dimension_item, dimension_item_id, points, explanation
        from jsonb_populate_recordset(null::public.quiz_questions, coalesce(p_questions, '[]'::jsonb));
        insert into public.quiz_question_choices (id, question_id, choice_order, label, is_correct)
        select id, question_id, choice_order, label, is_correct
        from jsonb_populate_recordset(null::public.quiz_question_choices, coalesce(p_choices, '[]'::jsonb));
        insert into public.quiz_question_attachments (
            id, question_id, attachment_order, attachment_type, label,
            external_url, storage_bucket, storage_path
        )
        select id, question_id, attachment_order, attachment_type, label,
            external_url, storage_bucket, storage_path
        from jsonb_populate_recordset(null::public.quiz_question_attachments, coalesce(p_attachments, '[]'::jsonb));
    else
        update public.quiz_steps quiz_step
        set method_step_id = incoming_step.method_step_id,
            name = incoming_step.name,
            weight = incoming_step.weight
        from jsonb_populate_recordset(
            null::public.quiz_steps,
            coalesce(p_steps, '[]'::jsonb)
        ) incoming_step
        where quiz_step.id = incoming_step.id
          and quiz_step.quiz_id = p_quiz_id
          and (
              quiz_step.method_step_id is distinct from incoming_step.method_step_id
              or quiz_step.name is distinct from incoming_step.name
              or quiz_step.weight is distinct from incoming_step.weight
          );

        update public.quiz_questions quiz_question
        set prompt = incoming_question.prompt,
            points = incoming_question.points,
            explanation = incoming_question.explanation
        from jsonb_populate_recordset(
            null::public.quiz_questions,
            coalesce(p_questions, '[]'::jsonb)
        ) incoming_question
        join public.quiz_steps quiz_step
          on quiz_step.id = incoming_question.step_id
         and quiz_step.quiz_id = p_quiz_id
        where quiz_question.id = incoming_question.id
          and quiz_question.step_id = quiz_step.id
          and (
              quiz_question.prompt is distinct from incoming_question.prompt
              or quiz_question.points is distinct from incoming_question.points
              or quiz_question.explanation is distinct from incoming_question.explanation
          );

        update public.quiz_question_choices quiz_choice
        set label = incoming_choice.label
        from jsonb_populate_recordset(
            null::public.quiz_question_choices,
            coalesce(p_choices, '[]'::jsonb)
        ) incoming_choice
        join public.quiz_questions quiz_question
          on quiz_question.id = incoming_choice.question_id
        join public.quiz_steps quiz_step
          on quiz_step.id = quiz_question.step_id
         and quiz_step.quiz_id = p_quiz_id
        where quiz_choice.id = incoming_choice.id
          and quiz_choice.question_id = quiz_question.id
          and quiz_choice.label is distinct from incoming_choice.label;

        update public.quiz_question_attachments quiz_attachment
        set label = incoming_attachment.label,
            external_url = incoming_attachment.external_url
        from jsonb_populate_recordset(
            null::public.quiz_question_attachments,
            coalesce(p_attachments, '[]'::jsonb)
        ) incoming_attachment
        join public.quiz_questions quiz_question
          on quiz_question.id = incoming_attachment.question_id
        join public.quiz_steps quiz_step
          on quiz_step.id = quiz_question.step_id
         and quiz_step.quiz_id = p_quiz_id
        where quiz_attachment.id = incoming_attachment.id
          and quiz_attachment.question_id = quiz_question.id
          and (
              quiz_attachment.label is distinct from incoming_attachment.label
              or quiz_attachment.external_url is distinct from incoming_attachment.external_url
          );
    end if;
end;
$$;

revoke all on function private.quiz_structure_matches(uuid, jsonb, jsonb, jsonb, jsonb, jsonb)
from public, anon, authenticated;

revoke all on function private.enforce_scenario_quiz_method_compatibility()
from public, anon, authenticated;

revoke all on function private.enforce_quiz_roleplay_method_compatibility()
from public, anon, authenticated;

revoke all on function public.admin_sync_method_quiz_association(uuid, uuid)
from public, anon, authenticated;

revoke all on function public.admin_update_quiz_aggregate(
    uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
)
from public, anon, authenticated;

grant execute on function private.quiz_structure_matches(uuid, jsonb, jsonb, jsonb, jsonb, jsonb)
to service_role;

grant execute on function private.enforce_scenario_quiz_method_compatibility()
to service_role;

grant execute on function private.enforce_quiz_roleplay_method_compatibility()
to service_role;

grant execute on function public.admin_sync_method_quiz_association(uuid, uuid)
to service_role;

grant execute on function public.admin_update_quiz_aggregate(
    uuid, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb
)
to service_role;
