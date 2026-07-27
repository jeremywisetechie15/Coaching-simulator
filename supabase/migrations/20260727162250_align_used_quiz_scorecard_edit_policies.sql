-- Keep database aggregate guards aligned with the application edit policy:
-- used content may change existing text and numeric values, not its structure.

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
    select id, quiz_id, method_step_id, step_order
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
        (select id, quiz_id, method_step_id, step_order
         from public.quiz_steps where quiz_id = p_quiz_id
         except
         select id, quiz_id, method_step_id, step_order from incoming_steps)
        union all
        (select id, quiz_id, method_step_id, step_order from incoming_steps
         except
         select id, quiz_id, method_step_id, step_order
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

create or replace function private.scorecard_structure_matches(
    p_scorecard_id uuid,
    p_steps jsonb,
    p_criteria jsonb
)
returns boolean
language sql
stable
set search_path = ''
as $$
with
incoming_steps as (
    select id, scorecard_id, method_step_id, step_order
    from jsonb_populate_recordset(null::public.scorecard_steps, coalesce(p_steps, '[]'::jsonb))
),
incoming_criteria as (
    select id, scorecard_step_id, skill_id, dimension, dimension_item_id
    from jsonb_populate_recordset(null::public.scorecard_criteria, coalesce(p_criteria, '[]'::jsonb))
)
select
    not exists (
        (select id, scorecard_id, method_step_id, step_order
         from public.scorecard_steps where scorecard_id = p_scorecard_id
         except
         select id, scorecard_id, method_step_id, step_order from incoming_steps)
        union all
        (select id, scorecard_id, method_step_id, step_order from incoming_steps
         except
         select id, scorecard_id, method_step_id, step_order
         from public.scorecard_steps where scorecard_id = p_scorecard_id)
    )
    and not exists (
        (select sc.id, sc.scorecard_step_id, sc.skill_id, sc.dimension, sc.dimension_item_id
         from public.scorecard_criteria sc
         join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
         where ss.scorecard_id = p_scorecard_id
         except
         select id, scorecard_step_id, skill_id, dimension, dimension_item_id
         from incoming_criteria)
        union all
        (select id, scorecard_step_id, skill_id, dimension, dimension_item_id
         from incoming_criteria
         except
         select sc.id, sc.scorecard_step_id, sc.skill_id, sc.dimension, sc.dimension_item_id
         from public.scorecard_criteria sc
         join public.scorecard_steps ss on ss.id = sc.scorecard_step_id
         where ss.scorecard_id = p_scorecard_id)
    );
$$;
