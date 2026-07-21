alter table public.quizzes
    add column categories text[] not null default '{}'::text[];

update public.quizzes
set categories = array[trim(category)]
where nullif(trim(category), '') is not null;

alter table public.quizzes
    drop column category;

comment on column public.quizzes.domain is
    'Optional quiz domain. Null means that the quiz is not assigned to a domain.';

comment on column public.quizzes.categories is
    'Optional categories for the selected quiz domain. An empty array means that no category is assigned.';

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
    end if;
end;
$$;
